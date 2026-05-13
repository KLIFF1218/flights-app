import type { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'ioredis';

const redisConfig = (configService: ConfigService): RedisOptions => {
  return {
    host: configService.getOrThrow<string>('REDIS_HOST'),
    port: configService.getOrThrow<number>('REDIS_PORT'),
    password: configService.getOrThrow<string>('REDIS_PASSWORD'),
  };
};

export { redisConfig };
