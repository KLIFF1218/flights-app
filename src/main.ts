import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { getCorsConfig } from './config/cors.config';
import { getSwaggerConfig } from './config/swagger.config';

import './telemetry';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const config = app.get(ConfigService);

  const port = config.getOrThrow<number>('HTTP_PORT');
  const host = config.get<string>('HTTP_HOST', '0.0.0.0');
  const env = config.getOrThrow<string>('NODE_ENV');

  app.set('trust proxy', 1);
  app.use(helmet());

  app.enableCors(getCorsConfig(config));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  if (config.get('SWAGGER_ENABLED') === 'true') {
    const swaggerConfig = getSwaggerConfig();
    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('/docs', app, document, {
      jsonDocumentUrl: 'openapi.json',
    });

    logger.log('Swagger enabled at /docs');
  }

  app.enableShutdownHooks();

  await app.listen(port, host);

  logger.log(
    {
      port,
      host,
      env,
    },
    'HTTP server started',
  );
}

bootstrap().catch((error) => {
  console.error('Fatal bootstrap error', error);
  process.exit(1);
});
