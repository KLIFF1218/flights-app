import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { YoomoneyService } from './providers/yoomoney/yoomoney.service';
import {
  Booking,
  Currency,
  PaymentProvider,
  StatusBooking,
  TransactionStatus,
} from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfirmationEnum } from 'nestjs-yookassa';

const mockPrismaService = {
  flight: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    update: jest.fn(),
  },
  booking: {
    update: jest.fn(),
  },
};

const mockYoomoneyService = {
  createPayment: jest.fn(),
};

const mockBooking: Booking = {
  id: 'booking_1',
  flightId: 'flight_1',
  seats: 2,
  status: StatusBooking.PENDING,
  passengerName: 'Ivan',
  passengerLastName: 'Ivanov',
  passengerEmail: 'ivan@example.com',
  tripClass: 'ECONOMY',
};

const mockTransaction = {
  id: 'tx_1',
  amount: 1000,
  currency: Currency.RUB,
  status: TransactionStatus.PENDING,
  bookingId: mockBooking.id,
  userId: 'user_1',
};

const mockFlight = {
  id: 'flight_1',
  price: 1000,
  availableSeats: 10,
};

const mockPaymentResponse = {
  id: 'pay_1',
  amount: mockTransaction.amount,
  confirmation: {
    type: ConfirmationEnum.REDIRECT,
    confirmation_url: 'https://pay.test/redirect',
  },
};

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: YoomoneyService, useValue: mockYoomoneyService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('определен ли сервис', () => {
    expect(service).toBeDefined();
  });

  it('бросает NotFoundException если рейс не найден', async () => {
    mockPrismaService.flight.findUnique.mockResolvedValue(null);

    await expect(
      service.create(
        'ECONOMY',
        'not_exist',
        PaymentProvider.YOOKASSA,
        'user_1',
        Currency.RUB,
        mockBooking,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrismaService.transaction.create).not.toHaveBeenCalled();
  });

  it('успешно создает платеж и возвращает payment_link и booking', async () => {
    mockPrismaService.flight.findUnique.mockResolvedValue(mockFlight);
    mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);
    mockYoomoneyService.createPayment.mockResolvedValue(mockPaymentResponse);
    mockPrismaService.transaction.update.mockResolvedValue({
      ...mockTransaction,
      providerMeta: mockPaymentResponse,
    });

    const res = await service.create(
      'ECONOMY',
      mockFlight.id,
      PaymentProvider.YOOKASSA,
      mockTransaction.userId,
      Currency.RUB,
      mockBooking,
    );

    expect(res.payment_link).toBe(
      mockPaymentResponse.confirmation.confirmation_url,
    );
    expect(res.booking).toBe(mockBooking);

    expect(mockPrismaService.transaction.create).toHaveBeenCalled();
    expect(mockPrismaService.transaction.update).toHaveBeenCalled();
  });

  it('выбрасывает BadRequestException если provider не поддерживается', async () => {
    mockPrismaService.flight.findUnique.mockResolvedValue(mockFlight);
    mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

    await expect(
      service.create(
        'ECONOMY',
        mockFlight.id,
        PaymentProvider.STARS,
        mockTransaction.userId,
        Currency.RUB,
        mockBooking,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('при ошибке откатывает изменения: transaction, booking, flight', async () => {
    mockPrismaService.flight.findUnique.mockResolvedValue(mockFlight);
    mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);
    mockYoomoneyService.createPayment.mockRejectedValue(
      new Error('yoomoney error'),
    );

    await expect(
      service.create(
        'ECONOMY',
        mockFlight.id,
        PaymentProvider.YOOKASSA,
        mockTransaction.userId,
        Currency.RUB,
        mockBooking,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
      where: { id: mockTransaction.id },
      data: { status: TransactionStatus.FAILED },
    });

    expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
      where: { id: mockBooking.id },
      data: { status: StatusBooking.FAILED },
    });

    expect(mockPrismaService.flight.update).toHaveBeenCalledWith({
      where: { id: mockBooking.flightId },
      data: { availableSeats: { increment: mockBooking.seats } },
    });
  });

  it('бросает BadRequestException если confirmation.type !== REDIRECT', async () => {
    mockPrismaService.flight.findUnique.mockResolvedValue(mockFlight);
    mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

    mockYoomoneyService.createPayment.mockResolvedValue({
      confirmation: { type: 'QRCODE' },
    });

    await expect(
      service.create(
        'ECONOMY',
        mockFlight.id,
        PaymentProvider.YOOKASSA,
        mockTransaction.userId,
        Currency.RUB,
        mockBooking,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrismaService.transaction.update).toHaveBeenCalled();
  });

  it('логирует ошибку, если transaction.update падает в catch-блоке', async () => {
    mockPrismaService.flight.findUnique.mockResolvedValue(mockFlight);
    mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);
    mockYoomoneyService.createPayment.mockRejectedValue(
      new Error('payment error'),
    );

    mockPrismaService.transaction.update.mockRejectedValue(
      new Error('tx update fail'),
    );

    const loggerSpy = jest
      .spyOn((service as any).logger, 'error')
      .mockImplementation();

    await expect(
      service.create(
        'ECONOMY',
        mockFlight.id,
        PaymentProvider.YOOKASSA,
        mockTransaction.userId,
        Currency.RUB,
        mockBooking,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(loggerSpy).toHaveBeenCalled();
    loggerSpy.mockRestore();
  });

  it('логирует ошибку, если booking.update падает', async () => {
    mockPrismaService.flight.findUnique.mockResolvedValue(mockFlight);
    mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);
    mockYoomoneyService.createPayment.mockRejectedValue(
      new Error('payment error'),
    );

    mockPrismaService.booking.update.mockRejectedValue(
      new Error('booking update fail'),
    );

    const spy = jest
      .spyOn((service as any).logger, 'error')
      .mockImplementation();

    await expect(
      service.create(
        'ECONOMY',
        mockFlight.id,
        PaymentProvider.YOOKASSA,
        mockTransaction.userId,
        Currency.RUB,
        mockBooking,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('логирует ошибку, если flight.update падает', async () => {
    mockPrismaService.flight.findUnique.mockResolvedValue(mockFlight);
    mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);
    mockYoomoneyService.createPayment.mockRejectedValue(
      new Error('payment error'),
    );

    mockPrismaService.flight.update.mockRejectedValue(
      new Error('flight update fail'),
    );

    const spy = jest
      .spyOn((service as any).logger, 'error')
      .mockImplementation();

    await expect(
      service.create(
        'ECONOMY',
        mockFlight.id,
        PaymentProvider.YOOKASSA,
        mockTransaction.userId,
        Currency.RUB,
        mockBooking,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
