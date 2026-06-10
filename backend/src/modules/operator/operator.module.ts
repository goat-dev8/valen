import { Module } from '@nestjs/common';
import { OperatorController } from './operator.controller';
import { OperatorService } from './operator.service';
import { OperatorQueueService } from './operator-queue.service';
import { OperatorChainService } from './operator-chain.service';
import { OperatorAuthGuard } from './guards/operator-auth.guard';
import { HealthModule } from '../health/health.module';
import { SettlementModule } from '../settlement/settlement.module';
import { ChainService } from '../settlement/chain.service';

@Module({
  imports: [HealthModule, SettlementModule],
  controllers: [OperatorController],
  providers: [
    OperatorService,
    OperatorQueueService,
    OperatorChainService,
    OperatorAuthGuard,
    ChainService,
  ],
})
export class OperatorModule {}
