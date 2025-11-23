import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { getCorsConfig } from './config/cors.config';
import { PinoLoggerService } from './common/logger/pino-logger.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getSwaggerConfig } from './config/swagger.config';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import './telemetry';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // const logger = new Logger(AppModule.name);
  const logger = app.get(PinoLoggerService);
  app.useLogger(logger);
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
    logger.log(`Server is running at ${host}`);
  } catch (error) {
    logger.error(`Failed to start server ${error.message}`);
    process.exit(1);
  }
}
bootstrap();
