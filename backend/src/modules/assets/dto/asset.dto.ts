import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  chainId!: number;

  @ApiProperty()
  symbol!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  address!: string | null;

  @ApiProperty()
  decimals!: number;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  supportLevel!: string;

  @ApiProperty({ type: [String] })
  settlementModes!: string[];

  @ApiProperty()
  metadata!: Record<string, unknown>;

  @ApiProperty()
  source!: string;

  @ApiPropertyOptional({ nullable: true })
  sourceUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  verifiedAt!: string | null;
}
