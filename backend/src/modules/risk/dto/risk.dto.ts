import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RecalculateRiskDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class RiskScoreResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  executionId!: string;

  @ApiProperty()
  score!: number;

  @ApiProperty()
  tier!: string;

  @ApiProperty()
  requiresApproval!: boolean;

  @ApiProperty()
  calculatedAt!: string;
}

export class RiskModelResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true })
  organizationId!: string | null;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  status!: string;
}
