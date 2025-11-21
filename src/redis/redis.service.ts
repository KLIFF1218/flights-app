import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { redisConfig } from 'src/config/redis.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(RedisService.name);
  public client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.logger.log('Connecting to redis ...');

    this.client = new Redis({
      ...redisConfig(this.configService),
      maxRetriesPerRequest: 5,
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected is successfully');
    });

    this.client.on('error', (error) => {
      this.logger.error('Failed connect to redis');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<'OK'> {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      return await this.client.set(key, serializedValue, 'EX', ttl);
    } else {
      return await this.client.set(key, serializedValue);
    }
  }

  async delByPrefix(prefix: string): Promise<number | null> {
    const keys = await this.client.keys(`${prefix}*`);
    if (keys.length > 0) {
      return await this.client.del(...keys);
    }
    return null;
  }

  async delete(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async onModuleDestroy() {
    this.logger.log('Closing connection to redis...');

    await this.client.quit();

    this.logger.log('Closing connection to redis is successfully');
  }
}
