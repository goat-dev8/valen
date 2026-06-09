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
      eventHash: hashPayload({ executionId, decision: dto.decision }),
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
    created_at: Date;
  }): SettlementResponseDto {
    return {
      id: settlement.id,
      executionId: settlement.execution_id,
      chainId: settlement.chain_id,
      contractAddress: settlement.contract_address,
      status: settlement.status,
      txHash: settlement.tx_hash,
      createdAt: settlement.created_at.toISOString(),
    };
  }
}

@Injectable()
export class SettlementWorkerService {
  constructor(
    private readonly settlementsRepository: SettlementsRepository,
    private readonly executionsRepository: ExecutionsRepository,
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

    await this.settlementsRepository.updateStatus(settlementId, 'submitted', {
      submittedAt: new Date(),
    });

    try {
      const result = await this.settlementChainService.executeSettlement(execution);
      await this.settlementsRepository.updateStatus(settlementId, 'confirmed', {
        txHash: result.executeTxHash,
        blockNumber: result.executeBlockNumber,
        confirmedAt: new Date(),
      });

      await this.executionsRepository.updateStatus(
        settlement.execution_id,
        'executed',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.settlementsRepository.updateStatus(settlementId, 'failed', {
        failureReason: message.slice(0, 1000),
      });
      await this.executionsRepository.updateStatus(settlement.execution_id, 'failed');
      throw error;
    }
  }
}
