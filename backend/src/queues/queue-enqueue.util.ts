import { Queue } from 'bullmq';
import { DEFAULT_JOB_OPTIONS } from './bullmq.config';
import { PIPELINE_WORKER_OPTIONS } from './worker-options.constant';

const REENQUEUEABLE_STATES = new Set([
  'completed',
  'failed',
  'delayed',
  'waiting',
  'paused',
  'prioritized',
  'waiting-children',
]);

const STALE_ACTIVE_MS = PIPELINE_WORKER_OPTIONS.lockDuration + 15_000;

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
      const processedOn = existing.processedOn ?? 0;
      const ageMs = processedOn
        ? Date.now() - processedOn
        : Date.now() - (existing.timestamp ?? 0);
      if (ageMs < STALE_ACTIVE_MS) {
        return;
      }
      try {
        await existing.moveToFailed(
          new Error('Stale active job replaced by deterministic re-enqueue'),
          '0',
          true,
        );
      } catch {
        // Best-effort cleanup before remove.
      }
      await existing.remove();
    } else if (REENQUEUEABLE_STATES.has(state)) {
      await existing.remove();
    }
  }

  await queue.add(name, data, {
    ...DEFAULT_JOB_OPTIONS,
    jobId,
  });
}
