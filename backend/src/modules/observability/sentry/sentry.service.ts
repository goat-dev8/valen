import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/config.types';

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private initialized = false;
  private sentry: typeof import('@sentry/nestjs') | null = null;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async onModuleInit() {
    const dsn = this.configService.get('sentryDsn', { infer: true });
    if (!dsn) {
      this.logger.log('SENTRY_DSN not configured; Sentry disabled');
      return;
    }

    const Sentry = await import('@sentry/nestjs');
    Sentry.init({ dsn, environment: this.configService.get('nodeEnv', { infer: true }) });
    this.sentry = Sentry;
    this.initialized = true;
    this.logger.log('Sentry initialized');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  captureException(error: unknown): void {
    if (this.initialized) this.sentry?.captureException(error);
  }
}
