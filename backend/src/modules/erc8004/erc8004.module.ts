import { Module } from '@nestjs/common';
import { Erc8004Service } from './erc8004.service';
import { PublicAgentsController } from './public-agents.controller';

@Module({
  controllers: [PublicAgentsController],
  providers: [Erc8004Service],
  exports: [Erc8004Service],
})
export class Erc8004Module {}
