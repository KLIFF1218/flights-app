import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('RedisService', () => {
  let service: RedisService;
  let configService: ConfigService;
  let mockRedisClient: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    keys: jest.Mock;
    quit: jest.Mock;
    on: jest.Mock;
  };

  beforeEach(async () => {
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      quit: jest.fn(),
      on: jest.fn(),
    };

    (Redis as unknown as jest.Mock).mockImplementation(() => mockRedisClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const mockConfig = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
                REDIS_PASSWORD: 'pass',
              };
              return mockConfig[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('onModuleInit', () => {
    it('should initialize Redis client with correct config', () => {
      service.onModuleInit();

      expect(Redis).toHaveBeenCalledWith({
        host: 'localhost',
        port: 6379,
        password: 'pass',
        maxRetriesPerRequest: 5,
      });

      expect(mockRedisClient.on).toHaveBeenCalledWith(
        'connect',
        expect.any(Function),
      );
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
    });
  });

  describe('get', () => {
    it('should return null when key does not exist', async () => {
      service.onModuleInit();
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('missing');

      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith('missing');
    });

    it('should parse JSON and return object', async () => {
      service.onModuleInit();
      mockRedisClient.get.mockResolvedValue(JSON.stringify({ a: 1 }));

      const result = await service.get<{ a: number }>('key');

      expect(result).toEqual({ a: 1 });
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      service.onModuleInit();
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.set('key', { a: 1 });

      expect(result).toBe('OK');
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify({ a: 1 }),
      );
    });

    it('should set value with TTL', async () => {
      service.onModuleInit();
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.set('key', { a: 1 }, 60);

      expect(result).toBe('OK');
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify({ a: 1 }),
        'EX',
        60,
      );
    });
  });

  describe('delByPrefix', () => {
    it('should delete keys with prefix', async () => {
      service.onModuleInit();

      mockRedisClient.keys.mockResolvedValue(['p1', 'p2']);
      mockRedisClient.del.mockResolvedValue(2);

      const result = await service.delByPrefix('p');

      expect(result).toBe(2);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('p*');
      expect(mockRedisClient.del).toHaveBeenCalledWith('p1', 'p2');
    });

    it('should return null when no keys found', async () => {
      service.onModuleInit();

      mockRedisClient.keys.mockResolvedValue([]);

      const result = await service.delByPrefix('p');

      expect(result).toBeNull();
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should call redis.del with correct key', async () => {
      service.onModuleInit();

      mockRedisClient.del.mockResolvedValue(1);

      const result = await service.delete('key');

      expect(result).toBe(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith('key');
    });
  });

  describe('onModuleDestroy', () => {
    it('should close redis connection', async () => {
      service.onModuleInit();

      mockRedisClient.quit.mockResolvedValue('OK');

      await service.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });
});
