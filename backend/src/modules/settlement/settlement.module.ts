import { Module } from '@nestjs/common';
import { ExecutionsController, SettlementController } from './settlement.controller';
import { ExecutionsService } from './executions.service';
import { SettlementService, SettlementWorkerService } from './settlement.service';
import { ChainService, AlchemyService, SettlementChainService } from './chain.service';
import { QueuesModule } from '../../queues/queues.module';

@Module({
  imports: [QueuesModule],
  controllers: [ExecutionsController, SettlementController],
  providers: [
    ExecutionsService,
    SettlementService,
    SettlementWorkerService,
    ChainService,
    AlchemyService,
    SettlementChainService,
  ],
  exports: [ExecutionsService, SettlementService, SettlementWorkerService, ChainService, SettlementChainService],
})
export class SettlementModule {}
