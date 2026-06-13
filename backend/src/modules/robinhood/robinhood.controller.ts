import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RobinhoodService } from './robinhood.service';

@ApiTags('robinhood')
@Controller('v1/robinhood')
export class RobinhoodController {
  constructor(private readonly robinhoodService: RobinhoodService) {}

  @Get('assets')
  @ApiOperation({ summary: 'List Robinhood Chain assets and demo scenarios' })
  listAssets() {
    return this.robinhoodService.listAssets();
  }

  @Get('assets/:ticker')
  @ApiOperation({ summary: 'Get Robinhood Chain asset detail and scenarios' })
  getAsset(@Param('ticker') ticker: string) {
    return this.robinhoodService.getAsset(ticker);
  }
}
