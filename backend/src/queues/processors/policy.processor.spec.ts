import { PolicyProcessor } from './policy.processor';

describe('PolicyProcessor', () => {
  const settlementsRepository = {
    create: jest.fn().mockResolvedValue({ id: 'settlement-id' }),
  };
  const settlementProducer = {
    enqueue: jest.fn().mockResolvedValue(undefined),
  };
  const chainService = {
    getSettlementAddress: jest.fn().mockReturnValue('0x993622D55Ea095aB71165Caf191B21E6e3A71D4A'),
  };

  it('approves execution and enqueues settlement when risk score does not require approval', async () => {
    const executionsRepository = {
      updateStatus: jest.fn().mockResolvedValue({}),
      findById: jest.fn().mockResolvedValue({
        id: 'execution-id',
        target_chain_id: 421614,
        target_address: '0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3',
      }),
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
      { touch: jest.fn() } as never,
      executionsRepository as never,
      riskScoresRepository as never,
      settlementsRepository as never,
      settlementProducer as never,
      chainService as never,
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
    expect(settlementsRepository.create).toHaveBeenCalled();
    expect(settlementProducer.enqueue).toHaveBeenCalled();
    expect(notificationProducer.enqueue).not.toHaveBeenCalled();
  });

  it('rejects policy processing when no risk score exists', async () => {
    const executionsRepository = {
      updateStatus: jest.fn().mockResolvedValue({}),
      findById: jest.fn(),
    };
    const riskScoresRepository = {
      findLatestByExecution: jest.fn().mockResolvedValue(null),
    };
    const notificationProducer = {
      enqueue: jest.fn(),
    };

    const processor = new PolicyProcessor(
      { touch: jest.fn() } as never,
      executionsRepository as never,
      riskScoresRepository as never,
      settlementsRepository as never,
      settlementProducer as never,
      chainService as never,
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
