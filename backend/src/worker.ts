import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  console.log('VALEN worker bootstrap: creating Nest context');
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['error', 'warn', 'log'],
  });
  console.log('VALEN worker bootstrap: Nest context created');

  const logger = new Logger('WorkerBootstrap');
  logger.log('VALEN worker started');

  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception: ${error.message}`, error.stack);
  });

  process.on('unhandledRejection', (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    logger.error(`Unhandled rejection: ${message}`);
  });

  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received; shutting down worker');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('VALEN worker bootstrap failed', error);
  process.exit(1);
});
