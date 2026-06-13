import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Erc8004Service } from './erc8004.service';

@ApiTags('public-agents')
@Controller('v1/public/agents')
export class PublicAgentsController {
  constructor(private readonly erc8004Service: Erc8004Service) {}

  @Get(':agentSlug')
  @ApiOperation({ summary: 'Public agent identity profile (no auth)' })
  getBySlug(@Param('agentSlug') agentSlug: string) {
    return this.erc8004Service.getPublicProfile(agentSlug);
  }
}
