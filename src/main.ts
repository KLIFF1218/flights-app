import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { getCorsConfig } from './config/cors.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getSwaggerConfig } from './config/swagger.config';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import './telemetry';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);

  app.set('trust proxy', true);

  const port = config.getOrThrow<number>('HTTP_PORT');
  const host = config.getOrThrow<string>('HTTP_HOST');

  app.enableCors(getCorsConfig(config));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = getSwaggerConfig();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('/docs', app, swaggerDocument, {
    jsonDocumentUrl: 'openapi.json',
  });

  app.use(helmet());

  try {
    await app.listen(port ?? 3000);
  } catch (error) {
    process.exit(1);
  }
}
bootstrap();
