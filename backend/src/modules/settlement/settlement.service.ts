import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SettlementsRepository } from '../../database/repositories/settlements.repository';
import { ExecutionsRepository } from '../../database/repositories/executions.repository';
import { EmergencyActionsRepository } from '../../database/repositories/emergency-actions.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload } from '../../common/utils/hash.util';
import {
  ApprovalRequestDto,
  RetrySettlementDto,
  SettlementResponseDto,
  SettleRequestDto,
} from './dto/settlement.dto';
import { ExecutionsService } from './executions.service';
import { SettlementProducer } from '../../queues/producers/index';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ChainService, SettlementChainService } from './chain.service';

@Injectable()
export class SettlementService {
  constructor(
    private readonly settlementsRepository: SettlementsRepository,
    private readonly executionsRepository: ExecutionsRepository,
    private readonly emergencyActionsRepository: EmergencyActionsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly executionsService: ExecutionsService,
    private readonly settlementProducer: SettlementProducer,
    private readonly chainService: ChainService,
  ) {}

  async getSettlement(
    organizationId: string,
    executionId: string,
  ): Promise<SettlementResponseDto> {
    const execution = await this.executionsRepository.findByOrgAndId(
      organizationId,
      executionId,
    );
    if (!execution) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Execution not found',
      });
    }

    const settlement = await this.settlementsRepository.findByExecution(executionId);
    if (!settlement) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Settlement not found',
      });
    }

    return this.toDto(settlement);
  }

  async approve(
    organizationId: string,
    executionId: string,
    dto: ApprovalRequestDto,
    user: AuthenticatedUser,
  ) {
    const execution = await this.executionsRepository.findByOrgAndId(
      organizationId,
      executionId,
    );
    if (!execution) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Execution not found',
      });
    }

    if (execution.status !== 'approval_required') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Execution is not awaiting approval',
      });
    }

    const newStatus = dto.decision === 'approved' ? 'approved' : 'failed';
    const updated = await this.executionsRepository.updateStatus(
      executionId,
      newStatus,
    );

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: `execution.${dto.decision}`,
      entityType: 'execution',
      entityId: executionId,
      eventHash: hashPayload({ executionId, decision: dto.decision, approvalProofRef: dto.approvalProofRef }),
      payloadRef: dto.approvalProofRef,
    });

    return this.executionsService.toDto(updated!);
  }

  async settle(
    organizationId: string,
    executionId: string,
    dto: SettleRequestDto,
  ): Promise<SettlementResponseDto> {
    const pause = await this.emergencyActionsRepository.findActivePause(
      'organization',
      organizationId,
    );
    if (pause) {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Organization settlement is paused',
      });
    }

    const execution = await this.executionsRepository.findByOrgAndId(
      organizationId,
      executionId,
    );
    if (!execution) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Execution not found',
      });
    }

    if (execution.status !== 'approved') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Execution must be approved before settlement',
      });
    }

    const settlement = await this.settlementsRepository.create({
      organizationId,
      executionId,
      chainId: execution.target_chain_id,
      contractAddress: this.chainService.getSettlementAddress(execution.target_chain_id),
      targetAddress: execution.target_address ?? undefined,
    });

    await this.executionsRepository.updateStatus(
      executionId,
      'settlement_submitted',
    );

    await this.settlementProducer.enqueue({
      organizationId,
      executionId,
      settlementId: settlement.id,
      idempotencyKey: dto.idempotencyKey,
    });

    return this.toDto(settlement);
  }

  async retry(
    organizationId: string,
    settlementId: string,
    dto: RetrySettlementDto,
  ): Promise<SettlementResponseDto> {
    const settlement = await this.settlementsRepository.findById(settlementId);
    if (!settlement || settlement.organization_id !== organizationId) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Settlement not found',
      });
    }

    if (!['failed', 'reverted'].includes(settlement.status)) {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Settlement is not in a retryable state',
      });
    }

    const updated = await this.settlementsRepository.updateStatus(
      settlementId,
      'pending',
    );

    await this.settlementProducer.enqueue({
      organizationId,
      executionId: settlement.execution_id,
      settlementId,
      idempotencyKey: `retry:${settlementId}:${Date.now()}`,
    });

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'system',
      action: 'settlement.retry',
      entityType: 'settlement',
      entityId: settlementId,
      eventHash: hashPayload({ settlementId, reason: dto.reason }),
    });

    return this.toDto(updated!);
  }

  toDto(settlement: {
    id: string;
    execution_id: string;
    chain_id: number;
    contract_address: string;
    status: string;
    tx_hash: string | null;
    submit_tx_hash?: string | null;
    approve_tx_hash?: string | null;
    block_number?: string | null;
    on_chain_settlement_id?: string | null;
    failure_reason?: string | null;
    created_at: Date;
  }): SettlementResponseDto {
    return {
      id: settlement.id,
      executionId: settlement.execution_id,
      chainId: settlement.chain_id,
      contractAddress: settlement.contract_address,
      status: settlement.status,
      txHash: settlement.tx_hash,
      submitTxHash: settlement.submit_tx_hash ?? null,
      approveTxHash: settlement.approve_tx_hash ?? null,
      blockNumber: settlement.block_number ?? null,
      onChainSettlementId: settlement.on_chain_settlement_id ?? null,
      failureReason: settlement.failure_reason ?? null,
      relayerAddress: null,
      createdAt: settlement.created_at.toISOString(),
    };
  }
}

@Injectable()
export class SettlementWorkerService {
  constructor(
    private readonly settlementsRepository: SettlementsRepository,
    private readonly executionsRepository: ExecutionsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly settlementChainService: SettlementChainService,
  ) {}

  async processSettlement(settlementId: string): Promise<void> {
    const settlement = await this.settlementsRepository.findById(settlementId);
    if (!settlement) return;
    const execution = await this.executionsRepository.findById(settlement.execution_id);
    if (!execution) {
      await this.settlementsRepository.updateStatus(settlementId, 'failed', {
        failureReason: 'Execution not found for settlement',
      });
      return;
    }

    await this.settlementsRepository.updateStatus(settlementId, 'prepared');

    try {
      const result = await this.settlementChainService.executeSettlement(execution);
      await this.settlementsRepository.updateStatus(settlementId, 'confirmed', {
        txHash: result.executeTxHash,
        submitTxHash: result.submitTxHash,
        approveTxHash: result.approveTxHash,
        onChainSettlementId: result.settlementId,
        blockNumber: result.executeBlockNumber,
        submittedAt: new Date(),
        confirmedAt: new Date(),
      });

      await this.executionsRepository.updateStatus(
        settlement.execution_id,
        'executed',
      );

      await this.auditLogsRepository.append({
        organizationId: settlement.organization_id,
        actorType: 'system',
        actorId: 'settlement-worker',
        action: 'settlement.executed',
        entityType: 'settlement',
        entityId: settlementId,
        eventHash: result.settlementId,
        chainId: settlement.chain_id,
        txHash: result.executeTxHash,
      });

      await this.auditLogsRepository.append({
        organizationId: settlement.organization_id,
        actorType: 'system',
        actorId: 'settlement-worker',
        action: 'settlement.submit',
        entityType: 'settlement',
        entityId: settlementId,
        eventHash: result.submitTxHash,
        chainId: settlement.chain_id,
        txHash: result.submitTxHash,
      });

      await this.auditLogsRepository.append({
        organizationId: settlement.organization_id,
        actorType: 'system',
        actorId: 'settlement-worker',
        action: 'settlement.approve',
        entityType: 'settlement',
        entityId: settlementId,
        eventHash: result.approveTxHash,
        chainId: settlement.chain_id,
        txHash: result.approveTxHash,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.settlementsRepository.updateStatus(settlementId, 'failed', {
        failureReason: message.slice(0, 1000),
      });
      await this.executionsRepository.updateStatus(settlement.execution_id, 'failed');

      await this.auditLogsRepository.append({
        organizationId: settlement.organization_id,
        actorType: 'system',
        actorId: 'settlement-worker',
        action: 'settlement.failed',
        entityType: 'settlement',
        entityId: settlementId,
        eventHash: hashPayload({ settlementId, message: message.slice(0, 200) }),
        chainId: settlement.chain_id,
      });
      throw error;
    }
  }
}
