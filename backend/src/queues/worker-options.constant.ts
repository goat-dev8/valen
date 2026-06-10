export const PIPELINE_WORKER_OPTIONS = {
  concurrency: 1,
  lockDuration: 120_000,
  stalledInterval: 30_000,
  maxStalledCount: 3,
} as const;
