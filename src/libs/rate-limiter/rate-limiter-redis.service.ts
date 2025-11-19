import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Redis } from 'ioredis';
import { RedisService } from 'src/redis/redis.service';
import { RateLimitOptions } from 'src/common/decorators/rate-limit.decorator';

@Injectable()
export class RateLimiterService {
  constructor(private readonly redisService: RedisService) {}

  createLimiter(options: RateLimitOptions) {
    return new RateLimiterRedis({
      storeClient: this.redisService.client,
      keyPrefix: 'rl',
      points: options.points,
      duration: options.duration,
      blockDuration: 10,
    });
  }

  async consume(limiter: RateLimiterRedis, key: string) {
    await limiter.consume(key);
  }
}
