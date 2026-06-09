import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreatePolicyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreatePolicyVersionDto {
  @ApiProperty()
  @IsObject()
  rules!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  activationStrategy?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  approvalRequirements?: Record<string, unknown>;
}

export class PolicyCommentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvalRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activationTime?: string;
}

export class PolicyResponseDto {
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

  @ApiProperty({ nullable: true })
  activeVersionId!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class PolicyVersionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  policyId!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  rules!: Record<string, unknown>;

  @ApiProperty({ nullable: true })
  rulesHash!: string | null;

  @ApiProperty({ nullable: true })
  publishedAt!: string | null;

  @ApiProperty({ nullable: true })
  activatedAt!: string | null;

  @ApiProperty()
  createdAt!: string;
}
