// test/webhook/webhook.e2e-spec.ts
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
import { YoomoneyService } from '../providers/yoomoney/yoomoney.service';
import { MailService } from 'src/libs/mail/mail.service';
import { TransactionStatus } from '@prisma/client';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

describe('Webhook E2E — /webhook/yookassa', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;
  let redis: StartedTestContainer;

  const mailMock = { sendSuccessMail: jest.fn() };

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('testdb')
      .withUsername('test')
      .withPassword('test')
      .start();

    const dbUrl = container.getConnectionUri();
    process.env.POSTGRES_URI = dbUrl;
    process.env.DATABASE_URL = dbUrl;

    redis = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    const redisHost = redis.getHost();
    const redisPort = redis.getMappedPort(6379);

    process.env.REDIS_HOST = redisHost;
    process.env.REDIS_PORT = String(redisPort);

    execSync('pnpm prisma migrate deploy', {
      env: {
        ...process.env,
        POSTGRES_URI: dbUrl,
        DATABASE_URL: dbUrl,
      },
      stdio: 'inherit',
    });

    const mockYoo = {
      verifyWebhook: jest.fn().mockReturnValue(undefined),
      handleWebhook: jest.fn().mockResolvedValue({
        transactionId: '',
        bookingId: '',
        paymentId: '',
        status: TransactionStatus.PENDING,
      }),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(YoomoneyService)
      .useValue(mockYoo)
      .overrideProvider(MailService)
      .useValue(mailMock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  }, 120000);

  afterAll(async () => {
    await prisma.$disconnect().catch(() => {});
    await app.close().catch(() => {});
    await container.stop().catch(() => {});
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await prisma.transaction.deleteMany().catch(() => {});
    await prisma.booking.deleteMany().catch(() => {});
    await prisma.flight.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
    await prisma.airport.deleteMany().catch(() => {});
  });

  it('should process successful payment: update transaction and booking, send mail', async () => {
    const user = await prisma.user.create({
      data: { email: 'u1@test', password: 'x', fullName: 'U1' },
    });

    const dep = await prisma.airport.create({
      data: { code: 'MOW' },
    });
    const arr = await prisma.airport.create({
      data: { code: 'LED' },
    });

    const flight = await prisma.flight.create({
      data: {
        origin: 'MOW',
        destination: 'LED',
        availableSeats: 5,
        price: 100,
        departureAirportId: dep.id,
        arrivalAirportId: arr.id,
        departureDate: new Date('2025-01-01T10:00:00Z'),
        arrivalDate: new Date('2025-01-01T12:00:00Z'),
        tripClass: 'Y',
      },
    });

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        passengerName: 'P',
        passengerLastName: 'L',
        passengerEmail: 'p@test',
        seats: 1,
        tripClass: 'Y',
        flightId: flight.id,
      },
    });

    const transaction = await prisma.transaction.create({
      data: {
        amount: 100,
        currency: 'RUB',
        tripClass: 'Y',
        userId: user.id,
        bookingId: booking.id,
      },
    });

    const paymentId = 'pay-1';
    const mockResult = {
      transactionId: transaction.id,
      bookingId: booking.id,
      paymentId,
      status: TransactionStatus.SUCCEED,
    };

    const module = (app as any).get(YoomoneyService) as unknown as {
      handleWebhook: jest.Mock;
      verifyWebhook: jest.Mock;
    };
    module.handleWebhook.mockResolvedValueOnce(mockResult);

    await request(app.getHttpServer())
      .post('/webhook/yookassa')
      .send({
        event: 'payment.succeeded',
        object: {
          id: paymentId,
          metadata: { transactionId: transaction.id, bookingId: booking.id },
        },
      })
      .set('X-Forwarded-For', '185.71.76.1')
      .expect(200);

    const updatedTx = await prisma.transaction.findUnique({
      where: { id: transaction.id },
    });
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });

    expect(updatedTx).toBeDefined();
    expect(updatedTx.status).toBe(TransactionStatus.SUCCEED);
    expect(updatedTx.externalId).toBe(paymentId);
    expect(updatedBooking.status).toBe('CONFIRMED');
    expect(mailMock.sendSuccessMail).toHaveBeenCalledTimes(1);
    const mailArgs = mailMock.sendSuccessMail.mock.calls[0];
    expect(mailArgs[0].id).toBe(user.id);
    expect(mailArgs[1].id).toBe(booking.id);
  });

  it('should process canceled payment: cancel booking and increment seats', async () => {
    const user = await prisma.user.create({
      data: { email: 'u2@test', password: 'x', fullName: 'U2' },
    });

    const dep = await prisma.airport.create({
      data: { code: 'MOW' },
    });
    const arr = await prisma.airport.create({
      data: { code: 'LED' },
    });

    const flight = await prisma.flight.create({
      data: {
        origin: 'MOW',
        destination: 'LED',
        availableSeats: 2,
        price: 200,
        departureAirportId: dep.id,
        arrivalAirportId: arr.id,
        departureDate: new Date('2025-02-01T10:00:00Z'),
        arrivalDate: new Date('2025-02-01T12:00:00Z'),
        tripClass: 'Y',
      },
    });

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        passengerName: 'P2',
        passengerLastName: 'L2',
        passengerEmail: 'p2@test',
        seats: 1,
        tripClass: 'Y',
        flightId: flight.id,
      },
    });

    const transaction = await prisma.transaction.create({
      data: {
        amount: 200,
        currency: 'RUB',
        tripClass: 'Y',
        userId: user.id,
        bookingId: booking.id,
      },
    });

    const paymentId = 'pay-2';
    const mockResult = {
      transactionId: transaction.id,
      bookingId: booking.id,
      paymentId,
      status: TransactionStatus.CANCELED,
    };

    const module = (app as any).get(YoomoneyService) as unknown as {
      handleWebhook: jest.Mock;
      verifyWebhook: jest.Mock;
    };
    module.handleWebhook.mockResolvedValueOnce(mockResult);

    await request(app.getHttpServer())
      .post('/webhook/yookassa')
      .send({
        event: 'payment.canceled',
        object: {
          id: paymentId,
          metadata: { transactionId: transaction.id, bookingId: booking.id },
        },
      })
      .set('X-Forwarded-For', '185.71.76.1')
      .expect(200);

    const updatedTx = await prisma.transaction.findUnique({
      where: { id: transaction.id },
    });
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });
    const updatedFlight = await prisma.flight.findUnique({
      where: { id: flight.id },
    });

    expect(updatedTx.status).toBe(TransactionStatus.CANCELED);
    expect(updatedBooking.status).toBe('CANCELED');
    expect(updatedFlight.availableSeats).toBe(3);
    expect(mailMock.sendSuccessMail).not.toHaveBeenCalled();
  });
});
