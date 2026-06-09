import { RedisMemoryServer } from 'redis-memory-server';

const port = Number(process.env.REDIS_PORT ?? 6379);
const server = new RedisMemoryServer({ instance: { port } });
const host = await server.getHost();
const actualPort = await server.getPort();
console.log(`redis://${host}:${actualPort}`);
process.stdin.resume();
