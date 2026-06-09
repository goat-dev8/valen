import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/config.types';
import { DATABASE_POOL } from './database.constants';
import { createDatabasePool } from './database.factory';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AppConfig, true>) => {
        const databaseUrl = configService.get('databaseUrl', { infer: true });
        return createDatabasePool(databaseUrl);
      },
    },
    DatabaseService,
  ],
  exports: [DatabaseService, DATABASE_POOL],
})
export class DatabaseModule {}
