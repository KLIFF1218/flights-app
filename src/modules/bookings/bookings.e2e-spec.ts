import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import request from 'supertest';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { execSync } from 'node:child_process';

const mockYookassa = {
  createPayment: jest.fn().mockResolvedValue({
    id: 'payment_123',
    status: 'pending',
    confirmation: {
      type: 'redirect',
      confirmation_url: 'https://pay.test/payment_123',
    },
  }),
};

describe('Bookings E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let pg: StartedPostgreSqlContainer;
  let redis: StartedTestContainer;

  beforeAll(async () => {
    pg = await new PostgreSqlContainer('postgres:16')
      .withDatabase('testdb')
      .withUsername('test')
      .withPassword('test')
      .start();

    process.env.DATABASE_URL = pg.getConnectionUri();

    redis = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    const redisHost = redis.getHost();
    const redisPort = redis.getMappedPort(6379);

    process.env.REDIS_HOST = redisHost;
    process.env.REDIS_PORT = String(redisPort);

    execSync('pnpm prisma migrate deploy', { env: process.env });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('YoomoneyService')
      .useValue(mockYookassa)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  }, 120_000);

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
    await pg.stop();
    await redis.stop();
  });

  it('успешно создаёт booking и возвращает payment link', async () => {
    const flight = await prisma.flight.create({
      data: {
        fromCity: 'Moscow',
        toCity: 'NY',
        availableSeats: 50,
        price: 10000,
        departureTime: new Date(),
        arrivalTime: new Date(),
      },
    });

    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        password: '123456',
      },
    });

    const dto = {
      flightId: flight.id,
      seats: 2,
      passengerEmail: 'p@test.com',
      passengerLastName: 'Ivanov',
      passengerName: 'Ivan',
      userId: user.id,
      tripClass: 'ECONOMY',
      paymentMethod: 'YOOKASSA',
      currency: 'RUB',
    };

    const res = await request(app.getHttpServer())
      .post('/bookings')
      .send(dto)
      .expect(201);

    expect(res.body).toHaveProperty('payment_link');
    expect(res.body.booking).toHaveProperty('id');
    expect(res.body.payment_link).toBe('https://pay.test/payment_123');

    const updatedFlight = await prisma.flight.findUnique({
      where: { id: flight.id },
    });

    expect(updatedFlight?.availableSeats).toBe(48);

    const tx = await prisma.transaction.findFirst({
      where: { bookingId: res.body.booking.id },
    });

    expect(tx).toBeDefined();
    expect(tx?.amount.toNumber()).toBe(10000);
  });
});
