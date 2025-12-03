import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { Logger } from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: jest.Mocked<PrismaService>;
  let payment: jest.Mocked<PaymentService>;

  beforeEach(() => {
    prisma = {
      flight: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      booking: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    } as any;

    payment = {
      create: jest.fn(),
    } as any;

    service = new BookingsService(prisma, payment);

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('должен создать бронирование (успешный сценарий)', async () => {
    const dto = {
      flightId: 'F1',
      seats: 2,
      passengerEmail: 'test@mail.com',
      passengerLastName: 'Doe',
      passengerName: 'John',
      userId: 'U1',
      tripClass: 'ECONOMY',
      paymentMethod: 'card',
      currency: 'USD',
    };

    prisma.flight.findUnique.mockResolvedValue({
      id: 'F1',
      availableSeats: 5,
    } as any);

    const fakeBooking = {
      id: 'aaaaaaaa-bbbbbbbb',
      bookingNumber: null,
    };

    const fakeUpdatedBooking = {
      id: fakeBooking.id,
      bookingNumber: 'BK-2025-bbbbbbbb',
    };

    prisma.$transaction.mockImplementation(async (cb) => {
      return cb({
        booking: {
          create: jest.fn().mockResolvedValue(fakeBooking),
          update: jest.fn().mockResolvedValue(fakeUpdatedBooking),
        },
        flight: {
          update: jest.fn().mockResolvedValue(undefined),
        },
      } as any);
    });

    payment.create.mockResolvedValue('PAYMENT_OK');

    const result = await service.create(dto);

    expect(prisma.flight.findUnique).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(payment.create).toHaveBeenCalledWith(
      dto.tripClass,
      dto.flightId,
      dto.paymentMethod,
      dto.userId,
      dto.currency,
      fakeUpdatedBooking,
    );
    expect(result).toBe('PAYMENT_OK');
  });

  it('должен выкинуть ошибку если рейс не найден', async () => {
    prisma.flight.findUnique.mockResolvedValue(null);

    const dto = { flightId: 'X', seats: 1 } as any;

    await expect(service.create(dto)).rejects.toThrow(NotFoundException);
  });

  it('должен выкинуть ошибку если нет доступных мест', async () => {
    prisma.flight.findUnique.mockResolvedValue({
      availableSeats: 1,
    } as any);

    const dto = { seats: 5 } as any;

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('должен логировать и выбрасывать BadRequestException при любой ошибке в транзакции', async () => {
    const dto = {
      flightId: 'F1',
      seats: 1,
    } as any;

    prisma.flight.findUnique.mockResolvedValue({
      id: 'F1',
      availableSeats: 2,
    } as any);

    prisma.$transaction.mockRejectedValue(new Error('DB FAIL'));

    await expect(service.create(dto)).rejects.toThrow(HttpException);

    expect(Logger.prototype.error).toHaveBeenCalled();
  });

  it('должен возвращать список броней конкретного пользователя', async () => {
    prisma.booking.findMany.mockResolvedValue(['B1', 'B2'] as any);

    const result = await service.findByAllUser('U1');

    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: { userId: 'U1' },
      include: { flight: true },
      orderBy: { createdAt: 'desc' },
    });

    expect(result).toEqual(['B1', 'B2']);
  });

  it('должен выкинуть ошибку если брони не существует', async () => {
    prisma.booking.findUnique.mockResolvedValue(null);

    await expect(service.cancelBooking('ID')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('должен отменить бронь и вернуть обновлённую запись', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'B1',
      seats: 2,
      flight: {
        id: 'F1',
        availableSeats: 5,
      },
    } as any);

    prisma.flight.update.mockResolvedValue(undefined);
    prisma.booking.update.mockResolvedValue({
      id: 'B1',
      status: 'CANCELED',
    } as any);

    const result = await service.cancelBooking('B1');

    expect(prisma.flight.update).toHaveBeenCalledWith({
      where: { id: 'F1' },
      data: { availableSeats: 7 },
    });

    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'B1' },
      data: { status: 'CANCELED' },
    });

    expect(result).toEqual({ id: 'B1', status: 'CANCELED' });
  });
});
