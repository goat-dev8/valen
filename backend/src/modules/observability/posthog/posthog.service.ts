import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/config.types';

@Injectable()
export class PosthogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PosthogService.name);
  private client: import('posthog-node').PostHog | null = null;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async onModuleInit() {
    const apiKey = this.configService.get('posthogApiKey', { infer: true });
    if (!apiKey) {
      this.logger.log('POSTHOG_API_KEY not configured; PostHog disabled');
      return;
    }

    const { PostHog } = await import('posthog-node');
    this.client = new PostHog(apiKey, {
      host: this.configService.get('posthogHost', { infer: true }),
    });
    this.logger.log('PostHog initialized');
  }

  capture(event: string, distinctId: string, properties?: Record<string, unknown>) {
    this.client?.capture({ event, distinctId, properties });
  }

  async onModuleDestroy() {
    await this.client?.shutdown();
  }
}
