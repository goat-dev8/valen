import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ActionType } from '../../../common/enums';

export class CreateExecutionDto {
  @ApiProperty()
  @IsUUID()
  agentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @ApiProperty({ enum: ActionType })
  @IsEnum(ActionType)
  actionType!: ActionType;

  @ApiProperty()
  @IsInt()
  targetChainId!: number;

  @ApiProperty()
  @IsString()
  targetAddress!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assetAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assetSymbol?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiProperty()
  @IsUUID()
  mandateId!: string;

  @ApiProperty()
  @IsString()
  payloadHash!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payloadRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CancelExecutionDto {
  @ApiProperty()
  @IsString()
  reason!: string;
}

export class ExecutionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  agentId!: string;

  @ApiProperty({ nullable: true })
  mandateId!: string | null;

  @ApiProperty({ nullable: true })
  policyId!: string | null;

  @ApiProperty()
  idempotencyKey!: string;

  @ApiProperty()
  actionType!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  targetChainId!: number;

  @ApiProperty({ nullable: true })
  targetAddress!: string | null;

  @ApiProperty({ nullable: true })
  assetAddress!: string | null;

  @ApiProperty({ nullable: true })
  valueAmount!: string | null;

  @ApiProperty()
  requestPayloadHash!: string;

  @ApiProperty()
  metadata!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class AuditTimelineEventDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  eventName!: string;

  @ApiProperty()
  eventHash!: string;

  @ApiProperty()
  createdAt!: string;
}

export class ApprovalRequestDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsString()
  decision!: string;

  @ApiProperty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvalProofRef?: string;
}

export class SettleRequestDto {
  @ApiProperty()
  @IsString()
  idempotencyKey!: string;
}

export class SettlementResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  executionId!: string;

  @ApiProperty()
  chainId!: number;

  @ApiProperty()
  contractAddress!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  txHash!: string | null;

  @ApiProperty({ nullable: true })
  submitTxHash!: string | null;

  @ApiProperty({ nullable: true })
  approveTxHash!: string | null;

  @ApiProperty({ nullable: true })
  blockNumber!: string | null;

  @ApiProperty({ nullable: true })
  onChainSettlementId!: string | null;

  @ApiProperty({ nullable: true })
  failureReason!: string | null;

  @ApiProperty({ nullable: true })
  relayerAddress!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class RetrySettlementDto {
  @ApiProperty()
  @IsString()
  reason!: string;
}
