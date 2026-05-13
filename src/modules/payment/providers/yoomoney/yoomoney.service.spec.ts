import { Test, TestingModule } from '@nestjs/testing';
import { YoomoneyService } from './yoomoney.service';
import { ConfigService } from '@nestjs/config';
import {
  YookassaService,
  PaymentMethodsEnum,
  ConfirmationEnum,
  CurrencyEnum,
} from 'nestjs-yookassa';
import { ForbiddenException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionStatus } from '@prisma/client';
import ipRangeCheck from 'ip-range-check';

// Мокаем ip-range-check
jest.mock('ip-range-check', () => jest.fn());

describe('YoomoneyService', () => {
  let service: YoomoneyService;
  let yookassaService: jest.Mocked<YookassaService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    yookassaService = {
      payments: {
        create: jest.fn(),
        capture: jest.fn(),
      },
    } as any;

    configService = {
      getOrThrow: jest.fn().mockReturnValue('https://example.com'),
      get: jest.fn().mockReturnValue(false),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YoomoneyService,
        { provide: YookassaService, useValue: yookassaService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(YoomoneyService);
  });

  //
  // createPayment
  //
  it('should call yookassaService.payments.create with correct params', async () => {
    const amount = new Decimal(1000);
    const transactionId = 't123';
    const bookingId = 'b456';

    yookassaService.payments.create.mockResolvedValue({ id: 'pay_1' });

    const result = await service.createPayment(
      amount,
      transactionId,
      bookingId,
    );

    const successUrl = `https://example.com/payment/${transactionId}/success`;

    expect(yookassaService.payments.create).toHaveBeenCalledWith({
      amount: {
        currency: CurrencyEnum.RUB,
        value: amount.toNumber(),
      },
      description: 'Оплата авиабилета',
      save_payment_method: true,
      payment_method_data: { type: PaymentMethodsEnum.BANK_CARD },
      confirmation: {
        type: ConfirmationEnum.REDIRECT,
        return_url: successUrl,
      },
      capture: false,
      metadata: {
        transactionId,
        bookingId,
      },
    });

    expect(result).toEqual({ id: 'pay_1' });
  });

  //
  // handleWebhook
  //
  it('should process "payment.succeeded"', async () => {
    const dto = {
      event: 'payment.succeeded',
      object: {
        id: 'p1',
        metadata: { transactionId: 't1', bookingId: 'b1' },
      },
    };

    const result = await service.handleWebhook(dto as any);

    expect(result).toEqual({
      transactionId: 't1',
      bookingId: 'b1',
      paymentId: 'p1',
      status: TransactionStatus.SUCCEED,
    });
  });

  it('should process "payment.canceled"', async () => {
    const dto = {
      event: 'payment.canceled',
      object: {
        id: 'p2',
        metadata: { transactionId: 't2', bookingId: 'b2' },
      },
    };

    const result = await service.handleWebhook(dto as any);

    expect(result.status).toBe(TransactionStatus.CANCELED);
  });

  it('should process "payment.waiting_for_capture" and call capture()', async () => {
    const dto = {
      event: 'payment.waiting_for_capture',
      object: {
        id: 'p3',
        metadata: { transactionId: 't3', bookingId: 'b3' },
      },
    };

    yookassaService.payments.capture.mockResolvedValue(true);

    const result = await service.handleWebhook(dto as any);

    expect(yookassaService.payments.capture).toHaveBeenCalledWith('p3');
    expect(result.status).toBe(TransactionStatus.PENDING);
  });

  it('should not throw if capture() fails', async () => {
    const dto = {
      event: 'payment.waiting_for_capture',
      object: {
        id: 'p9',
        metadata: { transactionId: 't9', bookingId: 'b9' },
      },
    };

    yookassaService.payments.capture.mockRejectedValue(
      new Error('capture failed'),
    );

    const result = await service.handleWebhook(dto as any);

    // Ошибка логируется, но функция не падает
    expect(result.status).toBe(TransactionStatus.PENDING);
  });

  it('should warn for unhandled events', async () => {
    const dto = {
      event: 'unhandled.event',
      object: {
        id: 'p4',
        metadata: { transactionId: 't4', bookingId: 'b4' },
      },
    };

    const result = await service.handleWebhook(dto as any);

    expect(result.status).toBe(TransactionStatus.PENDING);
  });

  //
  // verifyWebhook
  //
  it('should allow request from allowed IP range', () => {
    (ipRangeCheck as jest.Mock).mockReturnValue(true);

    expect(() => service.verifyWebhook('185.71.76.10')).not.toThrow();
  });

  it('should throw ForbiddenException for disallowed IP', () => {
    (ipRangeCheck as jest.Mock).mockReturnValue(false);

    expect(() => service.verifyWebhook('1.1.1.1')).toThrow(ForbiddenException);
  });
});
