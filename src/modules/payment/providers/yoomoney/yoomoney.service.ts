import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Booking, Transaction, TransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  ConfirmationEnum,
  CurrencyEnum,
  PaymentMethodsEnum,
  YookassaService,
} from 'nestjs-yookassa';
import { YooKassaWebhookDto } from '../../webhook/dto/yookassa-webhook.dto';
import { PaymentWebhookResult } from '../../interfaces/payment-webhook-result.dto';
import ipRangeCheck from 'ip-range-check';

@Injectable()
export class YoomoneyService {
  private logger = new Logger(YoomoneyService.name);
  private APP_HOST: string;
  private API_ALLOWS: string[];
  constructor(
    private readonly yookassaService: YookassaService,
    private readonly configService: ConfigService,
  ) {
    this.APP_HOST = configService.getOrThrow<string>('APP_HOST');
    this.API_ALLOWS = [
      '185.71.76.0/27',
      '185.71.77.0/27',
      '77.75.153.0/25',
      '77.75.156.11',
      '77.75.156.35',
      '77.75.154.128/25',
      '2a02:5180::/32',
    ];
  }
  async createPayment(
    amount: Decimal,
    transactionId: string,
    bookingId: string,
  ) {
    const successUrl = `${this.APP_HOST}/payment/${transactionId}/success`;
    const capture = this.configService.get<boolean>('YOOKASSA_CAPTURE', false);
    const payment = await this.yookassaService.payments.create({
      amount: {
        currency: CurrencyEnum.RUB,
        value: amount.toNumber(),
      },
      description: 'Оплата авиабилета',
      save_payment_method: true,
      payment_method_data: { type: PaymentMethodsEnum.BANK_CARD },
      confirmation: { type: ConfirmationEnum.REDIRECT, return_url: successUrl },
      capture,
      metadata: {
        transactionId,
        bookingId,
      },
    });
    return payment;
  }

  async handleWebhook(dto: YooKassaWebhookDto): Promise<PaymentWebhookResult> {
    const transactionId = dto.object.metadata.transactionId;
    const bookingId = dto.object.metadata.bookingId;
    const paymentId = dto.object.id;
    let status: TransactionStatus = TransactionStatus.PENDING;
    console.log('webhook event:', dto.event);
    switch (dto.event) {
      case 'payment.waiting_for_capture':
        try {
          await this.yookassaService.payments.capture(paymentId);
          this.logger.log('Платеж захвачен: ', paymentId);
        } catch (error) {
          this.logger.error('Ошибка при захвате платежа: ', error);
        }
        break;
      case 'payment.succeeded': {
        status = TransactionStatus.SUCCEED;
        break;
      }
      case 'payment.canceled': {
        status = TransactionStatus.CANCELED;
        break;
      }
      default:
        this.logger.warn('Необрабатываемое событие webhook: ', dto.event);
    }

    return {
      transactionId,
      bookingId,
      paymentId,
      status,
    };
  }

  verifyWebhook(ip: string) {
    const allowed = ipRangeCheck(ip, this.API_ALLOWS);
    if (!allowed) {
      this.logger.debug('Неавторизованный IP-адрес webhook: ', ip);
      throw new ForbiddenException('Неавторизованный IP-адрес');
    }
    return;
  }
}
