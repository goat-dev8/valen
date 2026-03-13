import Redis, { RedisOptions } from 'ioredis';

export const REDIS_OP_TIMEOUT_MS = 8000;
export const WORKER_HEARTBEAT_KEY = 'valen:worker:heartbeat';
export const WORKER_HEARTBEAT_TTL_SECONDS = 120;

export function shouldReconnectOnRedisError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('readonly') ||
    message.includes('connect') ||
    message.includes('econnreset') ||
    message.includes('epipe') ||
    message.includes('etimedout') ||
    message.includes('socket') ||
    message.includes('closed') ||
    message.includes('reset') ||
    message.includes('broken pipe')
  );
}

export function createRedisRetryStrategy(): (times: number) => number {
  return (times: number) => Math.min(times * 200, 5000);
}

export function createProductionRedisOptions(redisUrl: string): RedisOptions {
  const tls = redisUrl.startsWith('rediss://') ? {} : undefined;
  return {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    connectTimeout: 10_000,
    keepAlive: 30_000,
    tls,
    retryStrategy: createRedisRetryStrategy(),
    reconnectOnError: shouldReconnectOnRedisError,
  };
}

export function createProductionRedisClient(redisUrl: string): Redis {
  const client = new Redis(redisUrl, createProductionRedisOptions(redisUrl));
  client.on('error', (error) => {
    console.error(`[redis] ${error.message}`);
  });
  client.on('reconnecting', () => {
    console.warn('[redis] reconnecting');
  });
  return client;
}

export async function withRedisTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
