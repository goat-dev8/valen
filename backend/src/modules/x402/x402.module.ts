import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BudgetModule } from '../budget/budget.module';
import { X402Controller, PublicPaymentsController } from './x402.controller';
import { X402Service } from './x402.service';

@Module({
  imports: [ConfigModule, BudgetModule],
  controllers: [X402Controller, PublicPaymentsController],
  providers: [X402Service],
  exports: [X402Service],
})
export class X402Module {}
