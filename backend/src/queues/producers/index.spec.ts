import { IntentProducer, SettlementProducer } from './index';

describe('queue producers', () => {
  const createQueueMock = () => ({
    add: jest.fn().mockResolvedValue({}),
    getJob: jest.fn().mockResolvedValue(undefined),
  });

  it('uses BullMQ-safe job IDs for intent jobs', async () => {
    const queue = createQueueMock();
    const producer = new IntentProducer(queue as never);

    await producer.enqueue({ organizationId: 'org-id', executionId: 'execution-id' });

    expect(queue.add).toHaveBeenCalledWith(
      'process-intent',
      { organizationId: 'org-id', executionId: 'execution-id' },
      expect.objectContaining({ jobId: 'intent-execution-id' }),
    );
  });

  it('uses BullMQ-safe job IDs for settlement jobs', async () => {
    const queue = createQueueMock();
    const producer = new SettlementProducer(queue as never);

    await producer.enqueue({
      organizationId: 'org-id',
      executionId: 'execution-id',
      settlementId: 'settlement-id',
      idempotencyKey: 'settle-key',
    });

    expect(queue.add).toHaveBeenCalledWith(
      'process-settlement',
      {
        organizationId: 'org-id',
        executionId: 'execution-id',
        settlementId: 'settlement-id',
        idempotencyKey: 'settle-key',
      },
      expect.objectContaining({ jobId: 'settlement-settle-key' }),
    );
  });
});
