import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Currency, Flight, PaymentProvider } from '@prisma/client';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import request from 'supertest';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';

describe('BookingsController (Full Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /bookings', () => {
    it('создает бронирование', async () => {
      const createDto: CreateBookingDto = {
        currency: Currency.RUB,
        flightId: 'cmhhwxq2j0069u7js1jckuulw',
        passengerEmail: 'test@email.com',
        passengerLastName: 'Tester',
        passengerName: 'Test',
        paymentMethod: PaymentProvider.YOOKASSA,
        seats: 2,
        tripClass: 'ECONOMY',
        userId: 'cmhqq4zp30000u7xo59s860kw',
      };

      const flight = await prisma.flight.findUnique({
        where: {
          id: createDto.flightId,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .send(createDto)
        .expect(201);

      expect(res.body.booking).toBeDefined();
      expect(res.body.payment_link).toBeDefined();

      const booking = await prisma.booking.findFirst({
        where: {
          userId: createDto.userId,
        },
      });

      const updatedFlight = await prisma.flight.findFirst({
        where: {
          id: createDto.flightId,
        },
      });

      expect(booking).toBeTruthy();
      expect(booking?.seats).toBe(2);
      expect(updatedFlight?.availableSeats).toBe(
        flight?.availableSeats - createDto.seats,
      );
    });
  });

  // describe('GET /bookings', () => {
  //   it('возвращает список бронирований пользователя', async () => {
  //     const res = await request(app.getHttpServer())
  //       .get('/bookings')
  //       .set('user-id', 'user_1')
  //       .expect(200);

  //     expect(Array.isArray(res.body)).toBe(true);
  //     expect(res.body.length).toBeGreaterThan(0);
  //   });
  // });

  describe('DELETE /bookings/:id', () => {
    it('отменяет бронирование', async () => {
      const booking = await prisma.booking.findFirst({
        include: {
          flight: true,
        },
      });

      const flight = await prisma.flight.findUnique({
        where: {
          id: booking?.flightId,
        },
      });

      const res = await request(app.getHttpServer())
        .delete(`/bookings/${booking?.id}`)
        .expect(200);

      expect(res.body.status).toBe('CANCELED');

      const updatedFlight = await prisma.flight.findUnique({
        where: { id: booking?.flightId },
      });

      expect(updatedFlight?.availableSeats).toBe(
        flight?.availableSeats + booking?.seats,
      );
    });
  });
});
