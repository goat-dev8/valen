import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SchedulerModule } from './scheduler.module';
import { SchedulerRunner } from './scheduler/jobs/scheduler.jobs';

async function bootstrap() {
  const logger = new Logger('SchedulerBootstrap');
  let app;

  try {
    app = await NestFactory.createApplicationContext(SchedulerModule, {
      logger: ['error', 'warn', 'log'],
    });

    const runner = app.get(SchedulerRunner);
    await runner.runScheduledJobs();
    logger.log('VALEN scheduler run completed');
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('VALEN scheduler run failed', error instanceof Error ? error.stack : error);
    if (app) {
      await app.close().catch(() => undefined);
    }
    process.exit(1);
  }
}

bootstrap();
