import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty()
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  defaultChainId?: number;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  defaultChainId?: number;

  @ApiPropertyOptional({ enum: ['conservative', 'standard', 'custom'] })
  @IsOptional()
  @IsString()
  riskMode?: string;

  @ApiPropertyOptional({ enum: ['fail_closed', 'monitor_only'] })
  @IsOptional()
  @IsString()
  complianceMode?: string;
}

export class OrganizationResponseDto {
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

  @ApiProperty({ nullable: true })
  defaultChainId!: number | null;

  @ApiProperty()
  riskMode!: string;

  @ApiProperty()
  complianceMode!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
