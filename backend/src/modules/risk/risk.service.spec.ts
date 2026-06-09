import { RiskWorkerService } from './risk.service';

describe('RiskWorkerService', () => {
  it('marks execution risk_failed when on-chain metadata is missing', async () => {
    const riskScoresRepository = {
      create: jest.fn(),
    };
    const executionsRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'execution-id',
        organization_id: 'org-id',
        metadata: {},
      }),
      updateStatus: jest.fn().mockResolvedValue({}),
    };
    const policyProducer = {
      enqueue: jest.fn(),
    };

    const worker = new RiskWorkerService(
      riskScoresRepository as never,
      executionsRepository as never,
      policyProducer as never,
    );

    await expect(worker.processExecution('execution-id')).rejects.toThrow(
      'metadata.onchain is required',
    );

    expect(executionsRepository.updateStatus).toHaveBeenCalledWith(
      'execution-id',
      'risk_failed',
    );
    expect(riskScoresRepository.create).not.toHaveBeenCalled();
    expect(policyProducer.enqueue).not.toHaveBeenCalled();
  });
});
