import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProofsService } from './proofs.service';

@ApiTags('public-proofs')
@Controller('v1/public/proofs')
export class PublicProofsController {
  constructor(private readonly proofsService: ProofsService) {}

  @Get('executions/:id')
  @ApiOperation({ summary: 'Public execution proof (no auth)' })
  getExecution(@Param('id', ParseUUIDPipe) id: string) {
    return this.proofsService.getExecutionProof(id);
  }

  @Get('refusals/:id')
  @ApiOperation({ summary: 'Public refusal proof (no auth)' })
  getRefusal(@Param('id', ParseUUIDPipe) id: string) {
    return this.proofsService.getRefusalProof(id);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Public payment proof (no auth)' })
  getPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.proofsService.getPaymentProof(id);
  }

  @Get('pack')
  @ApiOperation({ summary: 'Latest one-of-each proof pack (no auth)' })
  getPack() {
    return this.proofsService.getProofPack();
  }
}
