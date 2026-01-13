import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { ConfigService } from '@nestjs/config';

export const getCorsConfig = (configService: ConfigService): CorsOptions => {
  return {
    origin: configService.getOrThrow<string>('HTTP_CORS'),
    credentials: true,
  };
};
