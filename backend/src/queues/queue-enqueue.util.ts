import { Queue } from 'bullmq';
import { DEFAULT_JOB_OPTIONS } from './bullmq.config';

const REENQUEUEABLE_STATES = new Set([
  'completed',
  'failed',
  'delayed',
  'waiting',
  'paused',
  'prioritized',
  'waiting-children',
]);

export async function enqueueDeterministicJob(
  queue: Queue,
  name: string,
  data: unknown,
  jobId: string,
): Promise<void> {
  const existing = await queue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state === 'active') {
      return;
    }
    if (REENQUEUEABLE_STATES.has(state)) {
      await existing.remove();
    }
  }

  await queue.add(name, data, {
    ...DEFAULT_JOB_OPTIONS,
    jobId,
  });
}
