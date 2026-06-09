import { PolicyProcessor } from './policy.processor';

describe('PolicyProcessor', () => {
  it('approves execution when latest risk score does not require approval', async () => {
    const executionsRepository = {
      updateStatus: jest.fn().mockResolvedValue({}),
    };
    const riskScoresRepository = {
      findLatestByExecution: jest.fn().mockResolvedValue({
        requires_approval: false,
      }),
    };
    const notificationProducer = {
      enqueue: jest.fn(),
    };

    const processor = new PolicyProcessor(
      executionsRepository as never,
      riskScoresRepository as never,
      notificationProducer as never,
    );

    await processor.process({
      id: 'job-id',
      data: { organizationId: 'org-id', executionId: 'execution-id' },
    } as never);

    expect(executionsRepository.updateStatus).toHaveBeenCalledWith(
      'execution-id',
      'approved',
    );
    expect(notificationProducer.enqueue).not.toHaveBeenCalled();
  });

  it('rejects policy processing when no risk score exists', async () => {
    const executionsRepository = {
      updateStatus: jest.fn().mockResolvedValue({}),
    };
    const riskScoresRepository = {
      findLatestByExecution: jest.fn().mockResolvedValue(null),
    };
    const notificationProducer = {
      enqueue: jest.fn(),
    };

    const processor = new PolicyProcessor(
      executionsRepository as never,
      riskScoresRepository as never,
      notificationProducer as never,
    );

    await expect(
      processor.process({
        id: 'job-id',
        data: { organizationId: 'org-id', executionId: 'execution-id' },
      } as never),
    ).rejects.toThrow('Risk score is required before policy processing');

    expect(executionsRepository.updateStatus).toHaveBeenCalledWith(
      'execution-id',
      'policy_rejected',
    );
  });
});
