import type { ConfigService } from '@nestjs/config';

export const isDev = (configService: ConfigService) => {
  return configService.getOrThrow<string>('NODE_ENV') === 'development';
};

export const IS_DEV_NODE = process.env['NODE_ENV'] === 'development';
