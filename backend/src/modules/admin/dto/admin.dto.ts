import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SuspendOrganizationDto {
  @ApiProperty()
  @IsString()
  reason!: string;
}

export class ReplayDeadLetterDto {
  @ApiProperty()
  @IsString()
  reason!: string;
}

export class EmergencyActionDto {
  @ApiProperty({ enum: ['global', 'organization', 'chain'] })
  @IsString()
  scope!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeRef?: string;

  @ApiProperty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  governanceApprovalRef?: string;
}

export class AdminOrganizationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  plan!: string;
}

export class DeadLetterJobResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  queueName!: string;

  @ApiProperty()
  jobId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  failureReason!: string;

  @ApiProperty()
  retryCount!: number;

  @ApiProperty()
  createdAt!: string;
}

export class EmergencyActionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  scope!: string;

  @ApiProperty({ nullable: true })
  scopeRef!: string | null;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  reason!: string;

  @ApiProperty()
  createdAt!: string;
}
