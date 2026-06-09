import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentWalletsService } from './agent-wallets.service';
import { AgentApiKeysService } from './agent-api-keys.service';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService, AgentWalletsService, AgentApiKeysService],
  exports: [AgentsService],
})
export class AgentsModule {}
