import { Test, TestingModule } from '@nestjs/testing';
import { FlightsCacheService } from './flights-cache.service';
import { RedisService } from 'src/redis/redis.service';
import { Flight } from '@prisma/client';

describe('FlightsCacheService', () => {
  let service: FlightsCacheService;
  let redis: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlightsCacheService,
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delByPrefix: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FlightsCacheService>(FlightsCacheService);
    redis = module.get(RedisService);
  });

  describe('getKey', () => {
    it('должен корректно формировать ключ', () => {
      const key = service.getKey('MOW', 'LED', '2025-01-01');
      expect(key).toBe('flights:MOW-LED-2025-01-01');
    });
  });

  describe('getCachedFlights', () => {
    it('должен вызывать redis.get с корректным ключом', async () => {
      redis.get.mockResolvedValue(null);

      await service.getCachedFlighs('MOW', 'LED', '2025-01-01');

      expect(redis.get).toHaveBeenCalledTimes(1);
      expect(redis.get).toHaveBeenCalledWith('flights:MOW-LED-2025-01-01');
    });

    it('должен возвращать кэшированные данные', async () => {
      const flights: Flight[] = [{ id: 1 } as any, { id: 2 } as any];

      redis.get.mockResolvedValue(flights);

      const result = await service.getCachedFlighs('MOW', 'LED', '2025-01-01');

      expect(result).toEqual(flights);
    });
  });

  describe('setCachedFlights', () => {
    it('должен вызвать redis.set без TTL когда ttl не передан', async () => {
      const flights: Flight[] = [{ id: 1 } as any];

      await service.setCachedFlights('MOW', 'LED', '2025-01-01', flights);

      expect(redis.set).toHaveBeenCalledTimes(1);
      expect(redis.set).toHaveBeenCalledWith(
        'flights:MOW-LED-2025-01-01',
        flights,
        undefined,
      );
    });

    it('должен вызвать redis.set c TTL при передаче ttl', async () => {
      const flights: Flight[] = [{ id: 1 } as any];

      await service.setCachedFlights('MOW', 'LED', '2025-01-01', flights, 300);

      expect(redis.set).toHaveBeenCalledTimes(1);
      expect(redis.set).toHaveBeenCalledWith(
        'flights:MOW-LED-2025-01-01',
        flights,
        300,
      );
    });
  });

  describe('clearCacheByPrefix', () => {
    it('должен вызвать redis.delByPrefix с правильным префиксом', async () => {
      await service.clearCacheByPrefix();

      expect(redis.delByPrefix).toHaveBeenCalledTimes(1);
      expect(redis.delByPrefix).toHaveBeenCalledWith('flights:');
    });
  });
});
