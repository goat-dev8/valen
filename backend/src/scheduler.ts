import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SchedulerModule } from './scheduler.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SchedulerModule, {
    logger: ['error', 'warn', 'log'],
  });

  const logger = new Logger('SchedulerBootstrap');
  logger.log('VALEN scheduler started');

  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received; shutting down scheduler');
    await app.close();
    process.exit(0);
  });
}

bootstrap();
