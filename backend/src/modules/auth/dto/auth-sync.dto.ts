import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class WalletRefDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chainType?: string;
}

export class AuthSyncDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  privyUserId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: [WalletRefDto] })
  @IsOptional()
  @IsArray()
  walletRefs?: WalletRefDto[];
}
