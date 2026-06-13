import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { AgentType } from '../../../common/enums';

export class CreateAgentDto {
  @ApiProperty()
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AgentType })
  @IsEnum(AgentType)
  agentType!: AgentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  defaultPolicyId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  capabilities?: string[];
}

export class UpdateAgentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  defaultPolicyId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  capabilities?: string[];
}

export class LinkWalletDto {
  @ApiProperty()
  @IsInt()
  chainId!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  walletAddress!: string;

  @ApiProperty()
  @IsString()
  walletType!: string;

  @ApiProperty()
  @IsBoolean()
  isPrimary!: boolean;
}

export class ReasonDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class CreateApiKeyDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  scopes!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  mandateId?: string;
}

export class AgentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  agentType!: string;

  @ApiProperty({ nullable: true })
  defaultPolicyId!: string | null;

  @ApiProperty({ nullable: true })
  publicSlug!: string | null;

  @ApiProperty()
  metadata!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class AgentWalletResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  chainId!: number;

  @ApiProperty()
  walletAddress!: string;

  @ApiProperty()
  walletType!: string;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty()
  status!: string;
}

export class ApiKeyResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  keyPrefix!: string;

  @ApiProperty({ nullable: true })
  mandateId!: string | null;

  @ApiProperty({ type: [String] })
  scopes!: string[];

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  expiresAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ required: false })
  oneTimeSecret?: string;
}
