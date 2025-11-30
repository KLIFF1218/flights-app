import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';

import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

import { execSync } from 'node:child_process';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FlightsCacheService } from './flights-cache.service';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

const TRIP_CLASS = 'Y';

describe('Flights E2E — /flights/search', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;
  let redisContainer: StartedTestContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('db_test')
      .withUsername('test')
      .withPassword('test')
      .start();

    const dbUrl = container.getConnectionUri();
    process.env.DATABASE_URL = dbUrl;

    execSync('pnpm prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
      },
      stdio: 'inherit',
    });

    redisContainer = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    const redisHost = redisContainer.getHost();
    const redisPort = redisContainer.getMappedPort(6379);

    process.env.REDIS_HOST = redisHost;
    process.env.REDIS_PORT = String(redisPort);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const depAirport = await prisma.airport.create({
      data: {
        id: 'A_DEP',
        code: 'MOW',
        name: 'Moscow',
        city: 'Moscow',
        country: 'RU',
      },
    });

    const arrAirport = await prisma.airport.create({
      data: {
        id: 'A_ARR',
        code: 'LED',
        name: 'Saint Petersburg',
        city: 'SPB',
        country: 'RU',
      },
    });

    await prisma.flight.create({
      data: {
        id: 'F1',
        origin: 'MOW',
        destination: 'LED',
        availableSeats: 100,
        price: 5000,
        departureDate: new Date('2025-01-01T10:00:00Z'),
        arrivalDate: new Date('2025-01-01T12:00:00Z'),
        tripClass: TRIP_CLASS,
        departureAirportId: depAirport.id,
        arrivalAirportId: arrAirport.id,
      },
    });
  }, 120000);

  afterEach(async () => {
    await prisma.booking.deleteMany().catch(() => {});
    await prisma.flight.deleteMany().catch(() => {});
    await prisma.airport.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
    await prisma.refreshToken.deleteMany().catch(() => {});
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect().catch(() => {});
    await app.close().catch(() => {});
    await container.stop().catch(() => {});
    await redisContainer.stop().catch(() => {});
  });

  it('Должен найти рейсы и записать их в кэш', async () => {
    const body = {
      directions: [
        {
          origin: 'MOW',
          destination: 'LED',
          date: '2025-01-01',
        },
      ],
      passengers: {
        adults: 1,
        children: 0,
        infants: 0,
      },
      trip_class: TRIP_CLASS,
    };

    const response = await request(app.getHttpServer())
      .post('/flights/search')
      .send(body)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);

    const f = response.body[0];

    expect(f.origin).toBe('MOW');
    expect(f.destination).toBe('LED');
    expect(f.availableSeats).toBe(100);
    expect(f.tripClass).toBe(TRIP_CLASS);
  });

  it('Если кэш содержит данные — возвращаем кэш', async () => {
    const body = {
      directions: [
        {
          origin: 'MOW',
          destination: 'LED',
          date: '2025-01-01',
        },
      ],
      passengers: { adults: 1, children: 0, infants: 0 },
      trip_class: TRIP_CLASS,
    };

    const firstResponse = await request(app.getHttpServer())
      .post('/flights/search')
      .send(body)
      .expect(200);

    expect(firstResponse.body.length).toBe(1);

    const secondResponse = await request(app.getHttpServer())
      .post('/flights/search')
      .send(body)
      .expect(200);

    expect(secondResponse.body).toEqual(firstResponse.body);
  });
});
