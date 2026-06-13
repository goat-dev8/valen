import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller';
import { RiskService, RiskWorkerService } from './risk.service';
import { QueuesModule } from '../../queues/queues.module';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [QueuesModule, BudgetModule],
  controllers: [RiskController],
  providers: [RiskService, RiskWorkerService],
  exports: [RiskService, RiskWorkerService],
})
export class RiskModule {}
