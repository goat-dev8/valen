import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class MandateTypedDataRequestDto {
  @ApiProperty()
  @IsUUID()
  agentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  policyId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  signerAddress!: string;

  @ApiProperty()
  @IsInt()
  chainId!: number;

  @ApiProperty({ type: [Number] })
  @IsArray()
  allowedChains!: number[];

  @ApiProperty({ type: [String] })
  @IsArray()
  allowedActions!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  allowedAssets!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  allowedTargets!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maxPerTransaction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maxTotal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvalThreshold?: string;

  @ApiProperty()
  @IsString()
  validUntil!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nonce?: string;
}

export class CreateSignedMandateDto extends MandateTypedDataRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  signature!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  typedDataHash!: string;

  @ApiPropertyOptional()
  @IsOptional()
  signedTypedData?: Record<string, unknown>;
}

export class RevokeMandateDto {
  @ApiProperty()
  @IsString()
  reason!: string;
}

export class MandateTypedDataResponseDto {
  @ApiProperty()
  typedData!: Record<string, unknown>;

  @ApiProperty()
  typedDataHash!: string;

  @ApiProperty()
  nonce!: string;
}

export class MandateResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  agentId!: string;

  @ApiProperty({ nullable: true })
  policyId!: string | null;

  @ApiProperty()
  chainId!: number;

  @ApiProperty()
  signerAddress!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: [Number] })
  allowedChains!: number[];

  @ApiProperty({ type: [String] })
  allowedActions!: string[];

  @ApiProperty({ type: [String] })
  allowedAssets!: string[];

  @ApiProperty({ type: [String] })
  allowedTargets!: string[];

  @ApiProperty({ nullable: true })
  maxPerTransaction!: string | null;

  @ApiProperty({ nullable: true })
  maxTotal!: string | null;

  @ApiProperty({ nullable: true })
  approvalThreshold!: string | null;

  @ApiProperty()
  typedDataHash!: string;

  @ApiProperty()
  signature!: string;

  @ApiProperty()
  validUntil!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ type: Object })
  scopeSnapshot!: Record<string, unknown>;
}
