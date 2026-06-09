import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { WebhookStatus } from '../../../common/enums';

const ALLOWED_EVENTS = [
  'execution.created',
  'execution.completed',
  'execution.failed',
  'settlement.confirmed',
  'agent.suspended',
];

export class CreateWebhookDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  url!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  subscribedEvents!: string[];
}

export class UpdateWebhookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  url?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  subscribedEvents?: string[];

  @ApiPropertyOptional({ enum: WebhookStatus })
  @IsOptional()
  @IsEnum(WebhookStatus)
  status?: WebhookStatus;
}

export class TestWebhookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventName?: string;
}

export class WebhookResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty({ type: [String] })
  subscribedEvents!: string[];

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: string;
}

export class WebhookTestResponseDto {
  @ApiProperty()
  deliveryId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  statusCode!: number | null;
}

export { ALLOWED_EVENTS };
