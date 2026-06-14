import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './config/config.types';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  console.log('VALEN API bootstrap: creating Nest app');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  console.log('VALEN API bootstrap: Nest app created');

  const configService = app.get(ConfigService<AppConfig, true>);
  const port = configService.get('port', { infer: true });
  const apiPrefix = configService.get('apiPrefix', { infer: true });
  console.log(`VALEN API bootstrap: listening on ${port}`);

  app.use(helmet());
  app.use(compression());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());

  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('VALEN API')
    .setDescription('Compliance, Risk and Permission Layer for Agentic Finance')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  console.log(`VALEN API bootstrap: ready on ${port}`);
}

bootstrap();
