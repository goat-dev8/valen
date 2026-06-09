import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty()
  data!: T;

  @ApiProperty()
  requestId!: string;

  @ApiProperty()
  traceId!: string;
}
