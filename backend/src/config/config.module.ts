import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configuration } from './configuration';
import { validateEnv } from './env.validation';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
      validate: validateEnv,
      load: [
        () => {
          const env = validateEnv(process.env as Record<string, unknown>);
          return configuration(env);
        },
      ],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
