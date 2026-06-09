import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RiskScoresRepository } from '../../database/repositories/risk-scores.repository';
import { ExecutionsRepository } from '../../database/repositories/executions.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload, sha256 } from '../../common/utils/hash.util';
import {
  RecalculateRiskDto,
  RiskModelResponseDto,
  RiskScoreResponseDto,
} from './dto/risk.dto';
import { PolicyProducer } from '../../queues/producers/index';

const TERMINAL = ['executed', 'failed', 'cancelled'];

const RISK_TIERS = ['low', 'medium', 'high', 'critical'] as const;

function getOnChainMetadata(execution: { metadata: Record<string, unknown> }) {
  const metadata = execution.metadata?.onchain;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('Execution metadata.onchain is required for risk processing');
  }
  return metadata as Record<string, unknown>;
}

function requireHex(value: unknown, key: string, bytes = 32): string {
  if (
    typeof value !== 'string' ||
    !new RegExp(`^0x[0-9a-fA-F]{${bytes * 2}}$`).test(value)
  ) {
    throw new Error(`metadata.onchain.${key} must be ${bytes} bytes`);
  }
  return value;
}

function requireRiskScore(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error('metadata.onchain.riskScore must be an integer between 0 and 100');
  }
  return value;
}

function requireRiskTier(value: unknown): (typeof RISK_TIERS)[number] {
  if (typeof value !== 'string' || !RISK_TIERS.includes(value as (typeof RISK_TIERS)[number])) {
    throw new Error('metadata.onchain.riskTier must be low, medium, high, or critical');
  }
  return value as (typeof RISK_TIERS)[number];
}

function requireBoolean(value: unknown, key: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`metadata.onchain.${key} must be boolean`);
  }
  return value;
}

function requireNumber(value: unknown, key: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`metadata.onchain.${key} must be a non-negative integer`);
  }
  return value;
}

@Injectable()
export class RiskService {
  constructor(
    private readonly riskScoresRepository: RiskScoresRepository,
    private readonly executionsRepository: ExecutionsRepository,
  ) {}

  async getScore(
    organizationId: string,
    executionId: string,
  ): Promise<RiskScoreResponseDto> {
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

    const score = await this.riskScoresRepository.findLatestByExecution(
      executionId,
    );
    if (!score) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Risk score not found',
      });
    }

    return this.toDto(score);
  }

  async recalculate(
    organizationId: string,
    executionId: string,
    dto: RecalculateRiskDto,
  ): Promise<RiskScoreResponseDto> {
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

    if (TERMINAL.includes(execution.status)) {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Cannot recalculate risk for terminal execution',
      });
    }

    const score = await this.calculateScore(organizationId, executionId, dto.reason);
    return this.toDto(score);
  }

  async listModels(organizationId: string): Promise<RiskModelResponseDto[]> {
    const models = await this.riskScoresRepository.listModels(organizationId);
    return models.map((m) => ({
      id: m.id,
      organizationId: m.organization_id,
      name: m.name,
      version: m.version,
      status: m.status,
    }));
  }

  private async calculateScore(
    organizationId: string,
    executionId: string,
    reason: string,
  ) {
    const factorSummary = { reason, factors: ['amount', 'counterparty'] };
    const scoreHash = sha256(hashPayload(factorSummary));
    return this.riskScoresRepository.create({
      organizationId,
      executionId,
      score: 25,
      tier: 'low',
      factorSummary,
      scoreHash,
      requiresApproval: false,
    });
  }

  toDto(score: {
    id: string;
    execution_id: string;
    score: number;
    tier: string;
    requires_approval: boolean;
    calculated_at: Date;
  }): RiskScoreResponseDto {
    return {
      id: score.id,
      executionId: score.execution_id,
      score: score.score,
      tier: score.tier,
      requiresApproval: score.requires_approval,
      calculatedAt: score.calculated_at.toISOString(),
    };
  }
}

@Injectable()
export class RiskWorkerService {
  constructor(
    private readonly riskScoresRepository: RiskScoresRepository,
    private readonly executionsRepository: ExecutionsRepository,
    private readonly policyProducer: PolicyProducer,
  ) {}

  async processExecution(executionId: string): Promise<void> {
    const execution = await this.executionsRepository.findById(executionId);
    if (!execution) return;

    try {
      const onchain = getOnChainMetadata(execution);
      const riskHash = requireHex(onchain.riskHash, 'riskHash');
      const factorSummary = {
        model: 'onchain-stylus',
        riskHash,
        historicalSummaryHash: requireHex(
          onchain.historicalSummaryHash,
          'historicalSummaryHash',
        ),
        externalRiskAttestationHash: requireHex(
          onchain.externalRiskAttestationHash,
          'externalRiskAttestationHash',
        ),
        externalRiskExpiry: requireNumber(
          onchain.externalRiskExpiry,
          'externalRiskExpiry',
        ),
        factors: {
          amountFactor: requireNumber(onchain.amountFactor, 'amountFactor'),
          assetFactor: requireNumber(onchain.assetFactor, 'assetFactor'),
          counterpartyFactor: requireNumber(
            onchain.counterpartyFactor,
            'counterpartyFactor',
          ),
          velocityFactor: requireNumber(onchain.velocityFactor, 'velocityFactor'),
          mandateUsageFactor: requireNumber(
            onchain.mandateUsageFactor,
            'mandateUsageFactor',
          ),
          anomalyFactor: requireNumber(onchain.anomalyFactor, 'anomalyFactor'),
        },
      };

      await this.riskScoresRepository.create({
        organizationId: execution.organization_id,
        executionId,
        score: requireRiskScore(onchain.riskScore),
        tier: requireRiskTier(onchain.riskTier),
        factorSummary,
        scoreHash: riskHash,
        requiresApproval: requireBoolean(
          onchain.requiresApproval,
          'requiresApproval',
        ),
      });
    } catch (error) {
      await this.executionsRepository.updateStatus(executionId, 'risk_failed');
      throw error;
    }

    await this.executionsRepository.updateStatus(executionId, 'validated');
    await this.policyProducer.enqueue({
      organizationId: execution.organization_id,
      executionId,
    });
  }
}
