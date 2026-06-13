import { SettlementWorkerService } from './settlement.service';

describe('SettlementWorkerService', () => {
  it('marks settlement failed when real on-chain execution metadata is missing', async () => {
    const settlementsRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'settlement-id',
        execution_id: 'execution-id',
        organization_id: 'org-id',
        chain_id: 421614,
      }),
      updateStatus: jest.fn().mockResolvedValue({}),
    };
    const executionsRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'execution-id',
        mandate_id: 'mandate-id',
        agent_id: 'agent-id',
        target_chain_id: 421614,
        action_type: 'transfer',
        target_address: '0x0000000000000000000000000000000000000000',
        metadata: {},
      }),
      updateStatus: jest.fn().mockResolvedValue({}),
    };
    const settlementChainService = {
      executeSettlement: jest
        .fn()
        .mockRejectedValue(
          new Error('Execution metadata.onchain is required for real settlement'),
        ),
    };
    const auditLogsRepository = {
      append: jest.fn().mockResolvedValue({}),
    };
    const mandatesService = {
      assertActiveForExecution: jest.fn().mockResolvedValue({}),
    };
    const budgetService = {
      commitSpend: jest.fn().mockResolvedValue(undefined),
    };

    const worker = new SettlementWorkerService(
      settlementsRepository as never,
      executionsRepository as never,
      auditLogsRepository as never,
      settlementChainService as never,
      mandatesService as never,
      budgetService as never,
    );

    await expect(worker.processSettlement('settlement-id')).rejects.toThrow(
      'Execution metadata.onchain is required for real settlement',
    );

    expect(settlementChainService.executeSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'execution-id',
        metadata: {},
      }),
    );
    expect(settlementsRepository.updateStatus).toHaveBeenCalledWith(
      'settlement-id',
      'failed',
      expect.objectContaining({
        failureReason: expect.stringContaining('metadata.onchain'),
      }),
    );
    expect(executionsRepository.updateStatus).toHaveBeenCalledWith(
      'execution-id',
      'failed',
    );
  });

  it('persists erc20_settled when the chain service executes token settlement', async () => {
    const settlementsRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'settlement-id',
        execution_id: 'execution-id',
        organization_id: 'org-id',
        chain_id: 421614,
      }),
      updateStatus: jest.fn().mockResolvedValue({}),
    };
    const executionsRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'execution-id',
        mandate_id: 'mandate-id',
        agent_id: 'agent-id',
        target_chain_id: 421614,
        action_type: 'transfer',
        target_address: '0x0000000000000000000000000000000000000001',
        asset_address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        value_amount: '1000',
        metadata: { onchain: {} },
      }),
      updateStatus: jest.fn().mockResolvedValue({}),
    };
    const settlementChainService = {
      executeSettlement: jest.fn().mockResolvedValue({
        settlementId: '0x'.padEnd(66, '1'),
        submitTxHash: '0x'.padEnd(66, '2'),
        approveTxHash: '0x'.padEnd(66, '3'),
        executeTxHash: '0x'.padEnd(66, '4'),
        executeBlockNumber: 123n,
        settlementMode: 'erc20',
      }),
    };
    const auditLogsRepository = {
      append: jest.fn().mockResolvedValue({}),
    };
    const mandatesService = {
      assertActiveForExecution: jest.fn().mockResolvedValue({}),
    };
    const budgetService = {
      commitSpend: jest.fn().mockResolvedValue(undefined),
    };

    const worker = new SettlementWorkerService(
      settlementsRepository as never,
      executionsRepository as never,
      auditLogsRepository as never,
      settlementChainService as never,
      mandatesService as never,
      budgetService as never,
    );

    await worker.processSettlement('settlement-id');

    expect(settlementsRepository.updateStatus).toHaveBeenCalledWith(
      'settlement-id',
      'erc20_settled',
      expect.objectContaining({
        txHash: '0x'.padEnd(66, '4'),
        onChainSettlementId: '0x'.padEnd(66, '1'),
        blockNumber: 123n,
      }),
    );
    expect(executionsRepository.updateStatus).toHaveBeenCalledWith(
      'execution-id',
      'executed',
    );
    expect(budgetService.commitSpend).toHaveBeenCalledWith('execution-id');
  });
});
