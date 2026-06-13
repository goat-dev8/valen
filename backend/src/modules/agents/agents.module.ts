import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentWalletsService } from './agent-wallets.service';
import { AgentApiKeysService } from './agent-api-keys.service';
import { Erc8004Module } from '../erc8004/erc8004.module';

@Module({
  imports: [Erc8004Module],
  controllers: [AgentsController],
  providers: [AgentsService, AgentWalletsService, AgentApiKeysService],
  exports: [AgentsService],
})
export class AgentsModule {}
