import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/config.types';
import { ALL_QUEUES } from '../common/constants/queues.constant';
import { createBullMqConnection } from './bullmq.config';
import {
  AuditProducer,
  ComplianceProducer,
  IntentProducer,
  NotificationProducer,
  PolicyProducer,
  RiskProducer,
  SettlementProducer,
} from './producers/index';

const queueRegistrations = ALL_QUEUES.map((name) =>
  BullModule.registerQueue({ name }),
);

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        connection: createBullMqConnection(configService),
        prefix: '{valen}',
      }),
    }),
    ...queueRegistrations,
  ],
  providers: [
    IntentProducer,
    ComplianceProducer,
    RiskProducer,
    PolicyProducer,
    SettlementProducer,
    AuditProducer,
    NotificationProducer,
  ],
  exports: [
    BullModule,
    IntentProducer,
    ComplianceProducer,
    RiskProducer,
    PolicyProducer,
    SettlementProducer,
    AuditProducer,
    NotificationProducer,
  ],
})
export class QueuesModule {}
