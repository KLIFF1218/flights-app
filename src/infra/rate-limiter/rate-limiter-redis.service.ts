import { Injectable } from '@nestjs/common';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { RedisService } from 'src/redis/redis.service';
import { RateLimitOptions } from 'src/common/decorators/rate-limit.decorator';

@Injectable()
export class RateLimiterService {
  constructor(private readonly redisService: RedisService) {}

  createLimiter(options: RateLimitOptions): RateLimiterRedis {
    return new RateLimiterRedis({
      storeClient: this.redisService.getClient(),
      keyPrefix: 'rl',
      points: options.points,
      duration: options.duration,
      blockDuration: 10,
    });
  }

  async consume(limiter: RateLimiterRedis, key: string): Promise<void> {
    await limiter.consume(key);
  }
}
