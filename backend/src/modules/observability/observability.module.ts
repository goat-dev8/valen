import { Module } from '@nestjs/common';
import { SentryModule } from './sentry/sentry.module';
import { PosthogModule } from './posthog/posthog.module';

@Module({
  imports: [SentryModule, PosthogModule],
  exports: [SentryModule, PosthogModule],
})
export class ObservabilityModule {}
