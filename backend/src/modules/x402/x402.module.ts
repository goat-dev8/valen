import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BudgetModule } from '../budget/budget.module';
import { X402Controller, PublicPaymentsController } from './x402.controller';
import { X402ChainService } from './x402-chain.service';
import { X402Service } from './x402.service';

@Module({
  imports: [ConfigModule, BudgetModule],
  controllers: [X402Controller, PublicPaymentsController],
  providers: [X402Service, X402ChainService],
  exports: [X402Service],
})
export class X402Module {}
