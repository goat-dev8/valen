import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class AuditLogResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  actorType!: string;

  @ApiProperty({ nullable: true })
  actorId!: string | null;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  entityType!: string;

  @ApiProperty()
  entityId!: string;

  @ApiProperty()
  eventHash!: string;

  @ApiProperty()
  createdAt!: string;
}

export class AuditExportDto {
  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiProperty({ enum: ['json', 'csv'] })
  @IsString()
  format!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  entityTypes!: string[];
}

export class AuditExportResponseDto {
  @ApiProperty()
  exportId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  format!: string;

  @ApiProperty()
  recordCount!: number;
}
