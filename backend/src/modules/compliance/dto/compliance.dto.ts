import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { ComplianceSubjectType } from '../../../common/enums';

export class CreateAttestationDto {
  @ApiProperty()
  @IsString()
  provider!: string;

  @ApiProperty({ enum: ComplianceSubjectType })
  @IsEnum(ComplianceSubjectType)
  subjectType!: ComplianceSubjectType;

  @ApiProperty()
  @IsString()
  subjectRef!: string;

  @ApiProperty()
  @IsString()
  attestationHash!: string;

  @ApiProperty()
  @IsDateString()
  expiresAt!: string;

  @ApiProperty()
  @IsString()
  reasonCode!: string;
}

export class ComplianceCheckResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  executionId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  reasonCode!: string;

  @ApiProperty()
  subjectType!: string;

  @ApiProperty()
  subjectRef!: string;

  @ApiProperty({ nullable: true })
  checkedAt!: string | null;
}

export class ComplianceAttestationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  subjectType!: string;

  @ApiProperty()
  subjectRef!: string;

  @ApiProperty()
  attestationHash!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  expiresAt!: string;
}

export class ComplianceSubjectResponseDto {
  @ApiProperty()
  subjectRef!: string;

  @ApiProperty({ type: [ComplianceAttestationResponseDto] })
  attestations!: ComplianceAttestationResponseDto[];

  @ApiProperty({ type: [ComplianceCheckResponseDto] })
  recentChecks!: ComplianceCheckResponseDto[];
}
