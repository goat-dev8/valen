import { ComplianceWorkerService } from './compliance.service';

describe('ComplianceWorkerService', () => {
  it('marks execution compliance_failed when on-chain metadata is missing', async () => {
    const complianceChecksRepository = {
      createCheck: jest.fn(),
    };
    const executionsRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'execution-id',
        organization_id: 'org-id',
        metadata: {},
      }),
      updateStatus: jest.fn().mockResolvedValue({}),
    };
    const riskProducer = {
      enqueue: jest.fn(),
    };

    const worker = new ComplianceWorkerService(
      complianceChecksRepository as never,
      executionsRepository as never,
      riskProducer as never,
    );

    await expect(worker.processExecution('execution-id')).rejects.toThrow(
      'metadata.onchain is required',
    );

    expect(executionsRepository.updateStatus).toHaveBeenCalledWith(
      'execution-id',
      'compliance_failed',
    );
    expect(complianceChecksRepository.createCheck).not.toHaveBeenCalled();
    expect(riskProducer.enqueue).not.toHaveBeenCalled();
  });
});
