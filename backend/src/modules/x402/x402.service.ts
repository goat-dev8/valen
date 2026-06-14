import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueryResultRow } from 'pg';
import { randomBytes } from 'crypto';
import { getAddress, Hex } from 'viem';
import { DatabaseService } from '../../database/database.service';
import { BudgetService } from '../budget/budget.service';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload } from '../../common/utils/hash.util';
import { parseExecutionAmount } from '../../common/utils/amount.util';
import { X402ChainService } from './x402-chain.service';

const USDC_SEPOLIA = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

function budgetRefusalMessage(reason: string | null): string {
  switch (reason) {
    case 'budget_exhausted':
      return 'Budget exhausted';
    case 'budget_paused':
      return 'Budget paused';
    case 'budget_exceeded':
      return 'Budget cap exceeded';
    case 'budget_missing':
      return 'Budget not configured';
    default:
      return reason ? reason.replace(/_/g, ' ') : 'Budget unavailable';
  }
}

type PaymentRow = QueryResultRow & {
  id: string;
  organization_id: string;
  agent_id: string;
  chain_id: number;
  recipient: string;
  asset_address: string;
  asset_symbol: string;
  amount: string;
  merchant_url: string | null;
  status: string;
  refusal_reason: string | null;
  evidence_hash: string | null;
  settlement_tx: string | null;
  nonce: string | null;
};

@Injectable()
export class X402Service {
  constructor(
    private readonly db: DatabaseService,
    private readonly budgetService: BudgetService,
    private readonly configService: ConfigService,
    private readonly x402ChainService: X402ChainService,
  ) {}

  async initiate(input: {
    organizationId: string;
    agentId: string;
    mandateId: string;
    merchantUrl?: string;
    recipient: string;
    amount: string;
    chainId?: number;
  }) {
    const chainId = input.chainId ?? 421614;
    const amountBase = parseExecutionAmount(input.amount, 6);
    const budget = await this.budgetService.getBudget(input.agentId);
    const budgetEval = budget
      ? (() => {
          const beforeSpent = BigInt(budget.spent);
          const cap = BigInt(budget.cap);
          const afterSpent = beforeSpent + amountBase;
          const remaining = cap > afterSpent ? cap - afterSpent : 0n;
          const reasonCode =
            budget.status !== 'active'
              ? budget.status === 'exhausted'
                ? ('budget_exhausted' as const)
                : ('budget_paused' as const)
              : afterSpent > cap
                ? remaining <= 0n
                  ? ('budget_exhausted' as const)
                  : ('budget_exceeded' as const)
                : ('budget_ok' as const);
          return {
            allow: reasonCode === 'budget_ok',
            reasonCode,
            remaining,
            amount: amountBase,
          };
        })()
      : null;

    const evidenceHash = hashPayload({
      agentId: input.agentId,
      recipient: input.recipient,
      amount: amountBase.toString(),
      chainId,
      merchantUrl: input.merchantUrl ?? null,
    });

    const status = !budgetEval || !budgetEval.allow ? 'refused' : 'initiated';
    const refusalReason =
      budgetEval && !budgetEval.allow
        ? budgetEval.reasonCode
        : !budgetEval
          ? 'budget_missing'
          : null;

    const result = await this.db.query<PaymentRow>(
      `INSERT INTO x402_payments (
         organization_id, agent_id, mandate_id, chain_id, merchant_url,
         recipient, asset_address, asset_symbol, amount, nonce, status,
         refusal_reason, evidence_hash, metadata
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,'USDC',$8,$9,$10,$11,$12,$13::jsonb)
       RETURNING *`,
      [
        input.organizationId,
        input.agentId,
        input.mandateId,
        chainId,
        input.merchantUrl ?? null,
        input.recipient.toLowerCase(),
        USDC_SEPOLIA,
        amountBase.toString(),
        `0x${randomBytes(32).toString('hex')}`,
        status,
        refusalReason,
        evidenceHash,
        JSON.stringify({
          phase: 'G',
          budgetEvaluation: budgetEval
            ? {
                allow: budgetEval.allow,
                reasonCode: budgetEval.reasonCode,
                remaining: budgetEval.remaining.toString(),
                amount: budgetEval.amount.toString(),
              }
            : null,
        }),
      ],
    );

    const payment = result.rows[0];
    if (!payment) throw new Error('Failed to create x402 payment intent');

    return {
      paymentId: payment.id,
      status: payment.status,
      refusalReason: payment.refusal_reason,
      evidenceHash: payment.evidence_hash,
      proofUrl: `/proofs/payments/${payment.id}`,
      refusalProofUrl:
        payment.status === 'refused' ? `/proofs/payments/${payment.id}` : null,
      budget: budget
        ? {
            cap: budget.cap,
            spent: budget.spent,
            remaining: budget.remaining,
            allow: budgetEval?.allow ?? false,
          }
        : null,
    };
  }

  async execute(organizationId: string, paymentId: string) {
    const payment = await this.findPayment(organizationId, paymentId);
    if (payment.status === 'refused') {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: budgetRefusalMessage(payment.refusal_reason),
        refusalReason: payment.refusal_reason,
      });
    }
    if (payment.status === 'settled') {
      return this.toPaymentResponse(payment);
    }

    const duplicate = await this.db.query(
      `SELECT id FROM x402_payments WHERE id <> $1 AND nonce = $2 AND status = 'settled' LIMIT 1`,
      [paymentId, payment.nonce],
    );
    if (duplicate.rows[0]) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Duplicate x402 nonce already settled',
      });
    }

    const amount = BigInt(payment.amount);
    const recipient = getAddress(payment.recipient);
    const nonce = payment.nonce as Hex;
    const settled = await this.x402ChainService.settleWithAuthorization({
      recipient,
      amount,
      nonce,
    });

    const evidenceHash = hashPayload({
      paymentId,
      status: 'settled',
      settlementTx: settled.txHash,
      payer: settled.from,
      nonce: settled.nonce,
      amount: amount.toString(),
      recipient,
    });

    await this.db.query(
      `UPDATE x402_payments
       SET status = 'settled',
           evidence_hash = $2,
           settlement_tx = $3,
           facilitator_response_hash = $4,
           metadata = metadata || $5::jsonb,
           updated_at = now()
       WHERE id = $1`,
      [
        paymentId,
        evidenceHash,
        settled.txHash,
        hashPayload({ method: 'eip3009', txHash: settled.txHash }),
        JSON.stringify({ settlement: { payer: settled.from, method: 'transferWithAuthorization' } }),
      ],
    );

    await this.budgetService.commitSpendForPayment(payment.agent_id, amount.toString(), paymentId);

    return this.toPaymentResponse(await this.findPayment(organizationId, paymentId));
  }

  async getPayment(organizationId: string, paymentId: string) {
    return this.toPaymentResponse(await this.findPayment(organizationId, paymentId));
  }

  async getPublicPayment(paymentId: string) {
    const result = await this.db.query<PaymentRow>(
      `SELECT * FROM x402_payments WHERE id = $1 AND status IN ('settled', 'refused', 'approved')`,
      [paymentId],
    );
    if (!result.rows[0]) {
      throw new NotFoundException({ code: ErrorCodes.NOT_FOUND, message: 'Payment not found' });
    }
    return this.toPaymentResponse(result.rows[0]);
  }

  private async findPayment(organizationId: string, paymentId: string): Promise<PaymentRow> {
    const result = await this.db.query<PaymentRow>(
      `SELECT * FROM x402_payments WHERE id = $1 AND organization_id = $2`,
      [paymentId, organizationId],
    );
    if (!result.rows[0]) {
      throw new NotFoundException({ code: ErrorCodes.NOT_FOUND, message: 'Payment not found' });
    }
    return result.rows[0];
  }

  private toPaymentResponse(payment: PaymentRow) {
    return {
      paymentId: payment.id,
      agentId: payment.agent_id,
      chainId: payment.chain_id,
      merchantUrl: payment.merchant_url,
      recipient: payment.recipient,
      assetSymbol: payment.asset_symbol,
      amount: payment.amount,
      status: payment.status,
      refusalReason: payment.refusal_reason,
      evidenceHash: payment.evidence_hash,
      settlementTx: payment.settlement_tx,
      nonce: payment.nonce,
      proofUrl: `/proofs/payments/${payment.id}`,
    };
  }
}
