import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OperatorAuthGuard, OPERATOR_KEY_HEADER } from './guards/operator-auth.guard';
import { OperatorService } from './operator.service';
import { OperatorQueueService } from './operator-queue.service';
import { OperatorChainService } from './operator-chain.service';
import { CreateExecutionDto } from '../settlement/dto/settlement.dto';
import { SettlementService } from '../settlement/settlement.service';
import { X402Service } from '../x402/x402.service';
import { Hex } from 'viem';

@ApiTags('operator')
@Controller('v1/operator')
@UseGuards(OperatorAuthGuard)
@ApiHeader({ name: OPERATOR_KEY_HEADER, required: true })
export class OperatorController {
  constructor(
    private readonly operatorService: OperatorService,
    private readonly queueService: OperatorQueueService,
    private readonly chainService: OperatorChainService,
    private readonly settlementService: SettlementService,
    private readonly x402Service: X402Service,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Live system health for operator dashboard' })
  getHealth() {
    return this.operatorService.getSystemHealth();
  }

  @Get('env')
  @ApiOperation({ summary: 'Validate env files without exposing secrets' })
  validateEnv() {
    return this.operatorService.validateEnvironmentFiles();
  }

  @Get('database/:table')
  @ApiOperation({ summary: 'Paginated live database table read' })
  queryTable(
    @Param('table') table: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 25,
    @Query('search') search?: string,
    @Query('filterColumn') filterColumn?: string,
    @Query('filterValue') filterValue?: string,
  ) {
    return this.operatorService.queryTable(table, {
      page,
      limit,
      search,
      filterColumn,
      filterValue,
    });
  }

  @Get('queues')
  @ApiOperation({ summary: 'BullMQ queue statistics' })
  listQueues() {
    return this.queueService.listQueueStats();
  }

  @Get('queues/:queueName/jobs')
  @ApiOperation({ summary: 'List jobs in a queue state' })
  listJobs(
    @Param('queueName') queueName: string,
    @Query('state') state: 'waiting' | 'active' | 'delayed' | 'completed' | 'failed' = 'failed',
    @Query('start', new ParseIntPipe({ optional: true })) start = 0,
    @Query('end', new ParseIntPipe({ optional: true })) end = 49,
  ) {
    return this.queueService.listJobs(queueName, state, start, end);
  }

  @Get('queues/:queueName/jobs/:jobId')
  @ApiOperation({ summary: 'Inspect a queue job payload' })
  getJob(@Param('queueName') queueName: string, @Param('jobId') jobId: string) {
    return this.queueService.getJob(queueName, jobId);
  }

  @Post('queues/:queueName/jobs/:jobId/retry')
  @ApiOperation({ summary: 'Retry a failed queue job' })
  retryJob(@Param('queueName') queueName: string, @Param('jobId') jobId: string) {
    return this.queueService.retryJob(queueName, jobId);
  }

  @Delete('queues/:queueName/jobs/:jobId')
  @ApiOperation({ summary: 'Remove a failed queue job' })
  removeJob(@Param('queueName') queueName: string, @Param('jobId') jobId: string) {
    return this.queueService.removeJob(queueName, jobId);
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Live deployed Solidity contract panel' })
  getContracts(@Query('chainId', new ParseIntPipe({ optional: true })) chainId = 421614) {
    return this.chainService.getContractPanel(chainId);
  }

  @Get('stylus')
  @ApiOperation({ summary: 'Live Stylus engine panel' })
  getStylus(@Query('chainId', new ParseIntPipe({ optional: true })) chainId = 421614) {
    return this.chainService.getStylusPanel(chainId);
  }

  @Get('treasury')
  @ApiOperation({ summary: 'Live treasury balances and fees' })
  getTreasury(@Query('chainId', new ParseIntPipe({ optional: true })) chainId = 421614) {
    return this.chainService.getTreasuryPanel(chainId);
  }

  @Get('governance/status')
  @ApiOperation({ summary: 'Governance and timelock status' })
  getGovernanceStatus(
    @Query('chainId', new ParseIntPipe({ optional: true })) chainId = 421614,
  ) {
    return this.chainService.getGovernanceStatus(chainId);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Database audit records and execution history' })
  getAudit(@Query('limit', new ParseIntPipe({ optional: true })) limit = 50) {
    return this.operatorService.getAuditPanel(limit);
  }

  @Post('validate/full')
  @ApiOperation({ summary: 'Run full stack validation report' })
  runFullValidation() {
    return this.operatorService.runFullValidation();
  }

  @Post('organizations/:organizationId/x402/initiate')
  @ApiOperation({ summary: 'Initiate x402 payment for operator lab / proof scripts' })
  initiateX402(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body()
    body: {
      agentId: string;
      mandateId: string;
      merchantUrl?: string;
      recipient: string;
      amount: string;
      chainId?: number;
    },
  ) {
    return this.x402Service.initiate({
      organizationId,
      agentId: body.agentId,
      mandateId: body.mandateId,
      merchantUrl: body.merchantUrl,
      recipient: body.recipient,
      amount: body.amount,
      chainId: body.chainId,
    });
  }

  @Post('organizations/:organizationId/executions')
  @ApiOperation({ summary: 'Create execution for settlement lab' })
  createExecution(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateExecutionDto,
  ) {
    return this.operatorService.createExecution(organizationId, dto);
  }

  @Post('organizations/:organizationId/executions/:executionId/trigger/:stage')
  @ApiOperation({ summary: 'Trigger compliance/risk/policy/settlement pipeline stage' })
  triggerStage(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('executionId', ParseUUIDPipe) executionId: string,
    @Param('stage') stage: 'compliance' | 'risk' | 'policy' | 'settlement' | 'intent',
    @Body() body: { idempotencyKey?: string },
  ) {
    if (stage === 'intent') {
      return this.operatorService.requeueIntent(organizationId, executionId);
    }
    if (stage === 'settlement') {
      return this.settlementService.settle(organizationId, executionId, {
        idempotencyKey: body.idempotencyKey ?? `operator-settle-${executionId}-${Date.now()}`,
      });
    }
    return this.operatorService.triggerPipelineStage(organizationId, executionId, stage);
  }

  @Post('settlement/onchain/submit')
  @ApiOperation({ summary: 'Submit settlement on-chain (testnet)' })
  submitOnChain(
    @Body() body: { chainId: number; payload: Record<string, unknown> },
  ) {
    return this.chainService.submitSettlementOnChain(body.chainId, body.payload);
  }

  @Post('settlement/onchain/approve')
  @ApiOperation({ summary: 'Approve settlement on-chain' })
  approveOnChain(@Body() body: { chainId: number; settlementId: Hex }) {
    return this.chainService.approveSettlementOnChain(body.chainId, body.settlementId);
  }

  @Post('settlement/onchain/execute')
  @ApiOperation({ summary: 'Execute settlement on-chain' })
  executeOnChain(
    @Body()
    body: {
      chainId: number;
      settlementId: Hex;
      callData: Hex;
      valueWei?: string;
    },
  ) {
    return this.chainService.executeSettlementOnChain(
      body.chainId,
      body.settlementId,
      body.callData,
      body.valueWei ?? '0',
    );
  }

  @Post('governance/proposal')
  @ApiOperation({ summary: 'Register governance proposal on-chain' })
  registerProposal(
    @Body() body: { chainId: number; proposalHash: Hex; metadataHash: Hex },
  ) {
    return this.chainService.registerGovernanceProposal(
      body.chainId,
      body.proposalHash,
      body.metadataHash,
    );
  }

  @Post('governance/queue')
  @ApiOperation({ summary: 'Queue governance timelock action' })
  queueGovernanceAction(
    @Body()
    body: {
      chainId: number;
      target: Hex;
      valueWei: string;
      data: Hex;
      predecessor: Hex;
      salt: Hex;
      delay: number;
    },
  ) {
    return this.chainService.queueGovernanceAction(
      body.chainId,
      body.target,
      body.valueWei,
      body.data,
      body.predecessor,
      body.salt,
      body.delay,
    );
  }

  @Post('governance/execute')
  @ApiOperation({ summary: 'Execute queued governance action' })
  executeGovernanceAction(
    @Body()
    body: {
      chainId: number;
      target: Hex;
      valueWei: string;
      data: Hex;
      predecessor: Hex;
      salt: Hex;
    },
  ) {
    return this.chainService.executeGovernanceAction(
      body.chainId,
      body.target,
      body.valueWei,
      body.data,
      body.predecessor,
      body.salt,
    );
  }
}
