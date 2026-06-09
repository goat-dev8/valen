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

    const factorSummary = { model: 'default', version: '1.0' };
    const scoreHash = sha256(JSON.stringify(factorSummary));

    await this.riskScoresRepository.create({
      organizationId: execution.organization_id,
      executionId,
      score: 30,
      tier: 'low',
      factorSummary,
      scoreHash,
      requiresApproval: false,
    });

    await this.executionsRepository.updateStatus(executionId, 'validated');
    await this.policyProducer.enqueue({
      organizationId: execution.organization_id,
      executionId,
    });
  }
}
