import { Test, TestingModule } from '@nestjs/testing';
import { FlightsService } from './flights.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FlightsCacheService } from './flights-cache.service';

const cache = {
  getCachedFlighs: jest.fn(),
  setCachedFlights: jest.fn(),
};

const prisma = {
  flight: {
    findMany: jest.fn(),
  },
};

describe('FlightsService - search()', () => {
  let service: FlightsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlightsService,
        { provide: PrismaService, useValue: prisma },
        { provide: FlightsCacheService, useValue: cache },
      ],
    }).compile();

    service = module.get(FlightsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const dto = {
    passengers: 1,
    trip_class: 'ECONOMY',
    directions: [
      {
        origin: 'MOW',
        destination: 'LED',
        date: '2025-12-01',
      },
    ],
  };

  it('should return cached flights if exists', async () => {
    const cachedFlights = [{ id: 'f1' }];
    cache.getCachedFlighs.mockResolvedValue(cachedFlights);

    const result = await service.search(dto as any);

    expect(cache.getCachedFlighs).toHaveBeenCalledWith(
      'MOW',
      'LED',
      '2025-12-01',
    );

    expect(prisma.flight.findMany).not.toHaveBeenCalled();
    expect(result).toBe(cachedFlights);
  });

  it('should request DB when cache is empty', async () => {
    cache.getCachedFlighs.mockResolvedValue(null);

    prisma.flight.findMany.mockResolvedValue([{ id: 'f2' }]);

    const result = await service.search(dto as any);

    expect(prisma.flight.findMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'f2' }]);
  });

  it('should call prisma.findMany with correct filters (dates & airports)', async () => {
    cache.getCachedFlighs.mockResolvedValue(null);

    prisma.flight.findMany.mockResolvedValue([]);

    await service.search(dto as any);

    const expectedStart = new Date('2025-12-01T00:00:00.000Z');
    const expectedEnd = new Date('2025-12-02T00:00:00.000Z');

    expect(prisma.flight.findMany).toHaveBeenCalledWith({
      where: {
        origin: 'MOW',
        destination: 'LED',
        departureDate: { gte: expectedStart, lt: expectedEnd },
      },
      orderBy: { departureDate: 'asc' },
    });
  });

  it('should save result in cache', async () => {
    cache.getCachedFlighs.mockResolvedValue(null);

    const flights = [{ id: 'f10' }];

    prisma.flight.findMany.mockResolvedValue(flights);

    await service.search(dto as any);

    expect(cache.setCachedFlights).toHaveBeenCalledWith(
      'MOW',
      'LED',
      '2025-12-01',
      flights,
    );
  });

  it('should check cache before calling DB', async () => {
    cache.getCachedFlighs.mockResolvedValue(null);
    prisma.flight.findMany.mockResolvedValue([]);

    await service.search(dto as any);

    expect(cache.getCachedFlighs).toHaveBeenCalledBefore(
      prisma.flight.findMany,
    );
  });

  it('should use the last direction to compute arrivalDate (coverage)', async () => {
    const dtoMulti = {
      passengers: 1,
      trip_class: 'ECONOMY',
      directions: [
        {
          origin: 'A',
          destination: 'B',
          date: '2025-10-10',
        },
        {
          origin: 'B',
          destination: 'C',
          date: '2025-10-12',
        },
      ],
    };

    cache.getCachedFlighs.mockResolvedValue(null);
    prisma.flight.findMany.mockResolvedValue([]);

    await service.search(dtoMulti as any);

    expect(prisma.flight.findMany).toHaveBeenCalledTimes(1);
  });
});
