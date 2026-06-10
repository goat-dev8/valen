import { SettlementWorkerService } from './settlement.service';

describe('SettlementWorkerService', () => {
  it('marks settlement failed when real on-chain execution metadata is missing', async () => {
    const settlementsRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'settlement-id',
        execution_id: 'execution-id',
      }),
      updateStatus: jest.fn().mockResolvedValue({}),
    };
    const executionsRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'execution-id',
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

    const worker = new SettlementWorkerService(
      settlementsRepository as never,
      executionsRepository as never,
      auditLogsRepository as never,
      settlementChainService as never,
    );

    await expect(worker.processSettlement('settlement-id')).rejects.toThrow(
      'Execution metadata.onchain is required for real settlement',
    );

    expect(settlementChainService.executeSettlement).toHaveBeenCalledWith({
      id: 'execution-id',
      metadata: {},
    });
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
});
