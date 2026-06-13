import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const row = {
    organization_id: '11111111-1111-4111-8111-111111111111',
    organization_name: 'VALEN Demo',
    default_chain_id: 421614,
    agent_id: '22222222-2222-4222-8222-222222222222',
    agent_name: 'USDC Agent',
    agent_status: 'active',
    default_policy_id: '33333333-3333-4333-8333-333333333333',
    agent_wallet_address: '0x0000000000000000000000000000000000000001',
    agent_wallet_chain_id: 421614,
    policy_count: 1,
    active_mandate_count: 1,
    owner_wallet_verified: true,
    verified_wallet_count: 1,
    total_executions: 2,
    executed_executions: 1,
    approval_required_executions: 0,
    failed_or_refused_executions: 1,
    last_execution_id: '44444444-4444-4444-8444-444444444444',
    last_execution_status: 'executed',
    last_execution_action_type: 'transfer',
    last_execution_chain_id: 421614,
    last_execution_asset_address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    last_execution_created_at: new Date('2026-06-13T00:00:00.000Z'),
    last_executed_execution_id: '44444444-4444-4444-8444-444444444444',
    last_executed_action_type: 'transfer',
    last_executed_chain_id: 421614,
    last_executed_asset_address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    last_executed_created_at: new Date('2026-06-13T00:00:00.000Z'),
    last_executed_tx_hash: '0xabc',
    last_executed_block_number: '123',
    last_refusal_execution_id: '55555555-5555-4555-8555-555555555555',
    last_refusal_status: 'policy_rejected',
    last_refusal_action_type: 'transfer',
    last_refusal_chain_id: 421614,
    last_refusal_asset_address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    last_refusal_created_at: new Date('2026-06-13T00:01:00.000Z'),
    last_robinhood_execution_id: '66666666-6666-4666-8666-666666666666',
    last_robinhood_status: 'executed',
    last_robinhood_action_type: 'custom',
    last_robinhood_asset_address: 'TSLA',
    last_robinhood_created_at: new Date('2026-06-13T00:02:00.000Z'),
    last_robinhood_tx_hash: '0xdef',
  };

  it('returns a Mission Control summary and caches it for five seconds', async () => {
    const db = {
      query: jest.fn().mockResolvedValue({ rows: [row] }),
    };
    const redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };
    const service = new DashboardService(db as never, redis as never);

    const summary = await service.summary(row.organization_id);

    expect(summary.agent?.name).toBe('USDC Agent');
    expect(summary.readiness.agentActive).toBe(true);
    expect(summary.readiness.mandateSigned).toBe(true);
    expect(summary.readiness.usdcBudgetFunded).toBe(false);
    expect(summary.latest.proof?.href).toBe(
      '/dashboard/executions/44444444-4444-4444-8444-444444444444/proof',
    );
    expect(summary.latest.robinhood?.asset).toBe('TSLA');
    expect(redis.set).toHaveBeenCalledWith(
      `dashboard:summary:${row.organization_id}`,
      expect.any(String),
      5,
    );
  });
});
