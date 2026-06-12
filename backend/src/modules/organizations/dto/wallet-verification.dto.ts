import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class WalletChallengeDto {
  @ApiProperty()
  @IsInt()
  chainId!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  walletAddress!: string;
}

export class WalletVerifyDto extends WalletChallengeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  signature!: string;
}

export class WalletChallengeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  chainId!: number;

  @ApiProperty()
  walletAddress!: string;

  @ApiProperty()
  nonce!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  expiresAt!: string;
}

export class WalletVerificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  chainId!: number;

  @ApiProperty()
  walletAddress!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  signature!: string | null;

  @ApiProperty({ nullable: true })
  verifiedAt!: string | null;

  @ApiProperty()
  challengeExpiresAt!: string;

  @ApiProperty()
  createdAt!: string;
}
