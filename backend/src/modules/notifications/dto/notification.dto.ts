import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NotificationStatus } from '../../../common/enums';

export class UpdateNotificationDto {
  @ApiProperty({ enum: NotificationStatus })
  @IsEnum(NotificationStatus)
  status!: NotificationStatus;
}

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  channel!: string;

  @ApiProperty()
  template!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  priority!: string;

  @ApiProperty()
  createdAt!: string;
}
