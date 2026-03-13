import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../redis/redis.service';
import { HealthService } from '../health/health.service';
import { ExecutionsService } from '../settlement/executions.service';
import { ExecutionsRepository } from '../../database/repositories/executions.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import {
  ComplianceProducer,
  IntentProducer,
  PolicyProducer,
  RiskProducer,
  SettlementProducer,
} from '../../queues/producers/index';
import { OperatorChainService } from './operator-chain.service';
import { OperatorQueueService } from './operator-queue.service';
import { CreateExecutionDto } from '../settlement/dto/settlement.dto';
import { validateEnv, envSchema } from '../../config/env.validation';

const ALLOWED_TABLES = [
  'organizations',
  'agents',
  'agent_wallets',
  'executions',
  'settlements',
  'compliance_checks',
  'risk_scores',
  'audit_logs',
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

const ENV_SPECS = {
  backend: {
    path: 'backend/.env',
    keys: [
      'DATABASE_URL',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'REDIS_URL',
      'PRIVY_APP_ID',
      'PRIVY_APP_SECRET',
      'ALCHEMY_API_KEY',
      'PRIVATE_KEY',
      'ARBITRUM_SEPOLIA_VALEN_REGISTRY',
      'ARBITRUM_SEPOLIA_VALEN_SETTLEMENT',
      'ROBINHOOD_TESTNET_VALEN_REGISTRY',
      'ROBINHOOD_TESTNET_VALEN_SETTLEMENT',
      'OPERATOR_DASHBOARD_SECRET',
    ],
  },
  contracts: {
    path: 'contracts/.env',
    keys: ['PRIVATE_KEY', 'ARB_SEPOLIA_RPC', 'ROBINHOOD_TESTNET_RPC'],
  },
  stylus: {
    path: 'stylus/.env',
    keys: ['PRIVATE_KEY', 'ARB_SEPOLIA_RPC', 'ROBINHOOD_TESTNET_RPC'],
  },
} as const;

@Injectable()
export class OperatorService {
  private readonly repoRoot: string;

  constructor(
    private readonly healthService: HealthService,
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly queueService: OperatorQueueService,
    private readonly chainService: OperatorChainService,
    private readonly executionsService: ExecutionsService,
    private readonly executionsRepository: ExecutionsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly intentProducer: IntentProducer,
    private readonly complianceProducer: ComplianceProducer,
    private readonly riskProducer: RiskProducer,
    private readonly policyProducer: PolicyProducer,
    private readonly settlementProducer: SettlementProducer,
  ) {
    this.repoRoot = join(process.cwd(), '..');
  }

  async getSystemHealth() {
    const [ready, sepoliaRpc, robinhoodRpc, queueStats, workerCount] =
      await Promise.all([
        this.healthService.ready(),
        this.chainService.pingRpc(421614).catch(() => null),
        this.chainService.pingRpc(46630).catch(() => null),
        this.queueService.listQueueStats(),
        this.queueService.getWorkerCount(),
      ]);

    const totalWaiting = queueStats.reduce((sum, q) => sum + q.waiting, 0);
    const totalFailed = queueStats.reduce((sum, q) => sum + q.failed, 0);
    const sepoliaStylus = await this.chainService
      .getStylusPanel(421614)
      .catch(() => null);

    const checks = {
      backendApi: { status: ready.status === 'ok' ? 'ok' : 'error', detail: ready },
      supabase: ready.checks.database ?? { status: 'error' },
      redis: ready.checks.redis ?? { status: 'error' },
      bullmqWorkers: {
        status: workerCount > 0 ? 'ok' : 'error',
        count: workerCount,
      },
      queueDepth: {
        status: totalFailed > 100 ? 'degraded' : 'ok',
        waiting: totalWaiting,
        failed: totalFailed,
        queues: queueStats,
      },
      scheduler: {
        status: 'ok',
        detail: 'Scheduler runs as separate process; verify via maintenance queue jobs',
      },
      stylusEngines: {
        status:
          sepoliaStylus?.engines.every((e) => e.healthy) === true ? 'ok' : 'error',
        engines: sepoliaStylus?.engines ?? [],
      },
      arbitrumRpc: {
        status: sepoliaRpc?.ok ? 'ok' : 'error',
        blockNumber: sepoliaRpc?.blockNumber?.toString(),
        latencyMs: sepoliaRpc?.latencyMs,
      },
      robinhoodRpc: {
        status: robinhoodRpc?.ok ? 'ok' : 'error',
        blockNumber: robinhoodRpc?.blockNumber?.toString(),
        latencyMs: robinhoodRpc?.latencyMs,
      },
    };

    const allOk = Object.values(checks).every((check) => {
      const status = (check as { status?: string }).status;
      return status === 'ok' || status === 'degraded';
    });

    return {
      status: allOk ? 'ok' : 'error',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  validateEnvironmentFiles() {
    const files: Record<
      string,
      {
        present: boolean;
        keys: Array<{ key: string; status: 'present' | 'missing' | 'invalid' }>;
      }
    > = {};

    for (const [name, spec] of Object.entries(ENV_SPECS)) {
      const fullPath = join(this.repoRoot, spec.path);
      const present = existsSync(fullPath);
      const keys = spec.keys.map((key) => ({
        key,
        status: 'missing' as 'present' | 'missing' | 'invalid',
      }));

      if (present) {
        const content = readFileSync(fullPath, 'utf8');
        const parsed: Record<string, string> = {};
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eq = trimmed.indexOf('=');
          if (eq <= 0) continue;
          parsed[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
        }

        for (const entry of keys) {
          const value = parsed[entry.key]?.trim();
          if (!value) {
            entry.status = 'missing';
          } else if (/placeholder|changeme|your[-_]/i.test(value)) {
            entry.status = 'invalid';
          } else {
            entry.status = 'present';
          }
        }
      }

      files[name] = { present, keys };
    }

    let backendRuntime: { valid: boolean; issues: string[] } = { valid: true, issues: [] };
    try {
      validateEnv(process.env);
    } catch (error) {
      backendRuntime = {
        valid: false,
        issues: [(error as Error).message],
      };
    }

    return { files, backendRuntime, schemaKeys: Object.keys(envSchema.shape) };
  }

  async queryTable(
    table: string,
    options: {
      page: number;
      limit: number;
      search?: string;
      filterColumn?: string;
      filterValue?: string;
    },
  ) {
    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
      throw new BadRequestException(`Table not allowed: ${table}`);
    }

    const offset = (options.page - 1) * options.limit;
    const params: unknown[] = [];
    const where: string[] = [];

    if (options.search) {
      params.push(`%${options.search}%`);
      where.push(
        `(id::text ILIKE $${params.length} OR COALESCE(metadata::text, '') ILIKE $${params.length})`,
      );
    }

    if (options.filterColumn && options.filterValue) {
      if (!/^[a-z_]+$/.test(options.filterColumn)) {
        throw new BadRequestException('Invalid filter column');
      }
      params.push(options.filterValue);
      where.push(`${options.filterColumn} = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRow = await this.databaseService.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${table} ${whereSql}`,
      params,
    );
    params.push(options.limit, offset);
    const rows = await this.databaseService.query<Record<string, unknown>>(
      `SELECT * FROM ${table} ${whereSql} ORDER BY created_at DESC NULLS LAST, id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return {
      table,
      page: options.page,
      limit: options.limit,
      total: Number(countRow.rows[0]?.count ?? 0),
      rows: rows.rows,
    };
  }

  async getAuditPanel(limit = 50) {
    const [dbLogs, executions] = await Promise.all([
      this.auditLogsRepository.listRecent(limit),
      this.executionsRepository.listRecent(limit),
    ]);

    return {
      databaseAuditLogs: dbLogs,
      recentExecutions: executions,
    };
  }

  async createExecution(organizationId: string, dto: CreateExecutionDto) {
    return this.executionsService.create(organizationId, dto);
  }

  async triggerPipelineStage(
    organizationId: string,
    executionId: string,
    stage: 'compliance' | 'risk' | 'policy' | 'settlement',
  ) {
    const execution = await this.executionsRepository.findByOrgAndId(
      organizationId,
      executionId,
    );
    if (!execution) {
      throw new NotFoundException('Execution not found');
    }

    switch (stage) {
      case 'compliance':
        await this.complianceProducer.enqueue({ organizationId, executionId });
        break;
      case 'risk':
        await this.riskProducer.enqueue({ organizationId, executionId });
        break;
      case 'policy':
        await this.policyProducer.enqueue({ organizationId, executionId });
        break;
      case 'settlement':
        await this.settlementProducer.enqueue({
          organizationId,
          executionId,
          settlementId: executionId,
          idempotencyKey: `operator-${stage}-${executionId}-${Date.now()}`,
        });
        break;
      default:
        throw new BadRequestException('Invalid stage');
    }

    return { queued: true, stage, executionId };
  }

  async requeueIntent(organizationId: string, executionId: string) {
    await this.intentProducer.enqueue({ organizationId, executionId });
    return { queued: true, stage: 'intent', executionId };
  }

  async runFullValidation() {
    const steps: Array<{
      name: string;
      status: 'pass' | 'fail';
      detail: string;
      durationMs?: number;
    }> = [];

    const runStep = async (name: string, fn: () => Promise<string>) => {
      const start = Date.now();
      try {
        const detail = await fn();
        steps.push({ name, status: 'pass', detail, durationMs: Date.now() - start });
      } catch (error) {
        steps.push({
          name,
          status: 'fail',
          detail: (error as Error).message,
          durationMs: Date.now() - start,
        });
      }
    };

    await runStep('Backend API', async () => {
      const live = this.healthService.live();
      if (live.status !== 'ok') throw new Error('Live check failed');
      return 'API process healthy';
    });

    await runStep('Database', async () => {
      const ok = await this.databaseService.ping();
      if (!ok) throw new Error('Database ping failed');
      return 'Supabase PostgreSQL reachable';
    });

    await runStep('Redis', async () => {
      const ok = await this.redisService.ping();
      if (!ok) throw new Error('Redis ping failed');
      return 'Redis PONG';
    });

    await runStep('Workers', async () => {
      const count = await this.queueService.getWorkerCount();
      if (count <= 0) {
        throw new Error('No active worker heartbeat or BullMQ consumer health detected');
      }
      const backlog = await this.queueService.getPipelineBacklog();
      return `${count} worker(s) active; pipeline backlog=${backlog}`;
    });

    await runStep('Queues', async () => {
      const stats = await this.queueService.listQueueStats();
      return `${stats.length} queues monitored`;
    });

    await runStep('Contracts (Sepolia)', async () => {
      const result = await this.chainService.verifyContractsLive(421614);
      return `${result.contractsChecked} contracts, ${result.enginesChecked} engines verified`;
    });

    await runStep('Contracts (Robinhood)', async () => {
      const result = await this.chainService.verifyContractsLive(46630);
      return `${result.contractsChecked} contracts, ${result.enginesChecked} engines verified`;
    });

    await runStep('Stylus', async () => {
      const panel = await this.chainService.getStylusPanel(421614);
      if (!panel.engines.every((e) => e.healthy)) {
        throw new Error('One or more Stylus engines unhealthy');
      }
      return 'All Sepolia Stylus engines healthy';
    });

    await runStep('Settlement wiring', async () => {
      const panel = await this.chainService.getContractPanel(421614);
      const settlement = panel.contracts.find((c) => c.name === 'ValenSettlement');
      if (!settlement?.bytecodeExists) throw new Error('Settlement contract unreachable');
      return `Settlement at ${settlement.address}`;
    });

    await runStep('Governance', async () => {
      const status = await this.chainService.getGovernanceStatus(421614);
      if (!status.timelockLinked) throw new Error('Governance timelock not linked');
      return `Timelock linked, minDelay=${status.minDelaySeconds}s`;
    });

    await runStep('Treasury', async () => {
      const treasury = await this.chainService.getTreasuryPanel(421614);
      return `Treasury balance ${treasury.nativeBalanceEth} ETH`;
    });

    await runStep('Audit', async () => {
      const audit = await this.getAuditPanel(5);
      return `${audit.databaseAuditLogs.length} recent audit log rows`;
    });

    const passed = steps.every((s) => s.status === 'pass');
    return {
      status: passed ? 'PASS' : 'FAIL',
      passed,
      steps,
      timestamp: new Date().toISOString(),
    };
  }
}
