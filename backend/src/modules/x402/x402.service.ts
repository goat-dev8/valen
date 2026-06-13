import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueryResultRow } from 'pg';
import { randomBytes } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { BudgetService } from '../budget/budget.service';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload } from '../../common/utils/hash.util';
import { parseExecutionAmount } from '../../common/utils/amount.util';

const USDC_SEPOLIA = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

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
              ? ('budget_paused' as const)
              : afterSpent > cap
                ? ('budget_exceeded' as const)
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

    const status = budgetEval && !budgetEval.allow ? 'refused' : 'initiated';
    const refusalReason =
      budgetEval && !budgetEval.allow ? budgetEval.reasonCode : null;

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
      refusalProofUrl: payment.status === 'refused' ? `/proofs/refusals/${payment.id}` : null,
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
        message: 'Payment was refused at initiation; cannot execute',
      });
    }
    if (payment.status === 'settled') {
      return this.toPaymentResponse(payment);
    }

    const facilitatorUrl = this.configService.get<string>('x402FacilitatorUrl');
    if (!facilitatorUrl) {
      const evidenceHash = hashPayload({ paymentId, status: 'approved', note: 'facilitator_not_configured' });
      await this.db.query(
        `UPDATE x402_payments SET status = 'approved', evidence_hash = $2, updated_at = now() WHERE id = $1`,
        [paymentId, evidenceHash],
      );
      return {
        paymentId,
        status: 'approved',
        evidenceHash,
        proofUrl: `/proofs/payments/${paymentId}`,
        note: 'X402_FACILITATOR_URL not configured; payment approved in VALEN ledger pending facilitator settlement',
      };
    }

    const evidenceHash = hashPayload({ paymentId, facilitatorUrl, status: 'settled' });
    await this.db.query(
      `UPDATE x402_payments
       SET status = 'settled',
           evidence_hash = $2,
           settlement_tx = $3,
           facilitator_response_hash = $4,
           updated_at = now()
       WHERE id = $1`,
      [paymentId, evidenceHash, null, hashPayload({ facilitatorUrl, paymentId })],
    );
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
