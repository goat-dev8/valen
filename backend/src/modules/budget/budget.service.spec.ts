import { BudgetService } from './budget.service';

const execution = {
  id: 'execution-id',
  organization_id: 'org-id',
  agent_id: 'agent-id',
  target_chain_id: 421614,
  asset_address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  value_amount: '1000',
} as never;

describe('BudgetService', () => {
  function service(budgetRows: unknown[]) {
    const db = {
      query: jest.fn().mockImplementation((sql: string) => {
        if (sql.includes('FROM agent_budgets')) {
          return Promise.resolve({ rows: budgetRows });
        }
        return Promise.resolve({ rows: [] });
      }),
    };
    return {
      service: new BudgetService(
        db as never,
        { findById: jest.fn() } as never,
        { append: jest.fn().mockResolvedValue({}) } as never,
      ),
      db,
    };
  }

  it('allows an execution within cap and records a pass event', async () => {
    const { service: budgetService } = service([
      {
        id: 'budget-id',
        organization_id: 'org-id',
        agent_id: 'agent-id',
        chain_id: 421614,
        asset_address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        asset_symbol: 'USDC',
        cap: '5000',
        spent: '1000',
        status: 'active',
      },
    ]);

    await expect(budgetService.evaluateExecution(execution)).resolves.toEqual(
      expect.objectContaining({
        allow: true,
        reasonCode: 'budget_ok',
        remaining: 3000n,
      }),
    );
  });

  it('refuses an execution over cap', async () => {
    const { service: budgetService } = service([
      {
        id: 'budget-id',
        organization_id: 'org-id',
        agent_id: 'agent-id',
        chain_id: 421614,
        asset_address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        asset_symbol: 'USDC',
        cap: '1500',
        spent: '1000',
        status: 'active',
      },
    ]);

    await expect(budgetService.evaluateExecution(execution)).resolves.toEqual(
      expect.objectContaining({
        allow: false,
        reasonCode: 'budget_exceeded',
        remaining: 0n,
      }),
    );
  });
});
