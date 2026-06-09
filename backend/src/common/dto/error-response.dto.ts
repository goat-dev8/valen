import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  message!: string;

  @ApiPropertyOptional()
  details?: Record<string, unknown>;

  @ApiProperty()
  requestId!: string;

  @ApiProperty()
  traceId!: string;
}
