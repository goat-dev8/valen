import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetsService } from './assets.service';

@ApiTags('assets')
@Controller('v1/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'List supported assets' })
  list(@Query('chainId') chainId?: string) {
    return this.assetsService.list(chainId ? Number(chainId) : undefined);
  }

  @Get(':chainId/:symbol')
  @ApiOperation({ summary: 'Get supported asset by chain and symbol' })
  get(
    @Param('chainId', ParseIntPipe) chainId: number,
    @Param('symbol') symbol: string,
  ) {
    return this.assetsService.get(chainId, symbol);
  }
}
