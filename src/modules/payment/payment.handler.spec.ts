import { PaymentHandler } from './payment.handler';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { MailService } from 'src/libs/mail/mail.service';
import { TransactionStatus, StatusBooking } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('PaymentHandler', () => {
  let handler: PaymentHandler;
  const prisma = {
    $transaction: jest.fn(),
  };
  const mail = {
    sendSuccessMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    handler = module.get<PaymentHandler>(PaymentHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const baseTx = {
    transaction: { update: jest.fn() },
    booking: { update: jest.fn() },
    flight: { update: jest.fn() },
  };

  const baseResult = {
    transactionId: 't1',
    bookingId: 'b1',
    paymentId: 'p1',
    status: TransactionStatus.SUCCEED,
  };

  it('должен обработать успешную оплату', async () => {
    const updatedTransaction = {
      id: 't1',
      status: TransactionStatus.SUCCEED,
      externalId: 'p1',
      user: { id: 'u1', email: 'test@example.com' },
    };

    const updatedBooking = {
      id: 'b1',
      status: StatusBooking.CONFIRMED,
      flightId: 'f1',
      seats: 2,
    };

    baseTx.transaction.update.mockResolvedValue(updatedTransaction);
    baseTx.booking.update.mockResolvedValue(updatedBooking);

    prisma.$transaction.mockImplementation(async (cb) => cb(baseTx as any));

    await handler.processResult(baseResult);

    expect(baseTx.transaction.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { status: TransactionStatus.SUCCEED, externalId: 'p1' },
      include: { user: true },
    });

    expect(baseTx.booking.update).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: { status: StatusBooking.CONFIRMED },
    });

    expect(mail.sendSuccessMail).toHaveBeenCalledWith(
      updatedTransaction.user,
      updatedBooking,
    );
  });

  it('должен обработать отмену оплаты', async () => {
    const canceledResult = {
      ...baseResult,
      status: TransactionStatus.CANCELED,
    };

    const updatedTransaction = {
      id: 't1',
      status: TransactionStatus.CANCELED,
      externalId: 'p1',
      user: { id: 'u1' },
    };

    const updatedBooking = {
      id: 'b1',
      status: StatusBooking.CANCELED,
      flightId: 'f1',
      seats: 2,
    };

    baseTx.transaction.update.mockResolvedValue(updatedTransaction);
    baseTx.booking.update.mockResolvedValue(updatedBooking);
    baseTx.flight.update.mockResolvedValue({});

    prisma.$transaction.mockImplementation(async (cb) => cb(baseTx as any));

    await handler.processResult(canceledResult);

    expect(baseTx.booking.update).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: { status: StatusBooking.CANCELED },
    });

    expect(baseTx.flight.update).toHaveBeenCalledWith({
      where: { id: 'f1' },
      data: { availableSeats: { increment: 2 } },
    });

    expect(mail.sendSuccessMail).not.toHaveBeenCalled();
  });

  it('должен залогировать ошибку если статус неизвестен', async () => {
    const unknownResult = { ...baseResult, status: 'SOMETHING' as any };

    const updatedTransaction = {
      id: 't1',
      status: 'SOMETHING',
      externalId: 'p1',
      user: { id: 'u1' },
    };

    baseTx.transaction.update.mockResolvedValue(updatedTransaction);
    prisma.$transaction.mockImplementation(async (cb) => cb(baseTx as any));

    const logSpy = jest.spyOn(handler['logger'], 'error').mockImplementation();

    await handler.processResult(unknownResult);

    expect(logSpy).toHaveBeenCalledWith('Статус транзакции не изменен');
    logSpy.mockRestore();
  });

  it('должен обработать ошибку если транзакция не найдена', async () => {
    baseTx.transaction.update.mockResolvedValue(null);

    prisma.$transaction.mockImplementation(async (cb) => cb(baseTx as any));

    const logSpy = jest.spyOn(handler['logger'], 'error').mockImplementation();

    await handler.processResult(baseResult);

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('должен логировать ошибку если $transaction падает', async () => {
    prisma.$transaction.mockRejectedValue(new Error('DB error'));

    const logSpy = jest.spyOn(handler['logger'], 'error').mockImplementation();

    await handler.processResult(baseResult);

    expect(logSpy).toHaveBeenCalledWith(
      'Ошибка при обработке результата платежа: ',
      expect.any(Error),
    );

    logSpy.mockRestore();
  });

  it('должен корректно обработать ошибку при отправке письма', async () => {
    const updatedTransaction = {
      id: 't1',
      status: TransactionStatus.SUCCEED,
      externalId: 'p1',
      user: { id: 'u1' },
    };

    const updatedBooking = {
      id: 'b1',
      status: StatusBooking.CONFIRMED,
      flightId: 'f1',
      seats: 2,
    };

    baseTx.transaction.update.mockResolvedValue(updatedTransaction);
    baseTx.booking.update.mockResolvedValue(updatedBooking);

    prisma.$transaction.mockImplementation(async (cb) => cb(baseTx as any));

    mail.sendSuccessMail.mockRejectedValue(new Error('Mail error'));

    const logSpy = jest.spyOn(handler['logger'], 'error').mockImplementation();

    await handler.processResult(baseResult);

    expect(logSpy).toHaveBeenCalledWith(
      'Ошибка при отправке письма: ',
      expect.any(Error),
    );

    logSpy.mockRestore();
  });
});
