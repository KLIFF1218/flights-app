import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConfirmationEnum,
  CurrencyEnum,
  PaymentMethodsEnum,
  YookassaService,
} from 'nestjs-yookassa';
import { Currency, TransactionStatus } from '@prisma/client';
import ipRangeCheck from 'ip-range-check';
import { PaymentProviderAdapter } from '../../interfaces/payment.provider.interface';
import { PaymentWebhookResult } from '../../interfaces/payment-webhook-result.dto';
import { YooKassaWebhookDto } from '../../webhook/dto/yookassa-webhook.dto';
import { Logger } from 'nestjs-pino';

@Injectable()
export class YookassaProvider implements PaymentProviderAdapter {
  private readonly appHost: string;
  private readonly allowedIps: string[];

  constructor(
    private readonly yookassa: YookassaService,
    private readonly config: ConfigService,
    private readonly logger: Logger,
  ) {
    this.appHost = this.config.getOrThrow<string>('APP_HOST');
    this.allowedIps = [
      '185.71.76.0/27',
      '185.71.77.0/27',
      '77.75.153.0/25',
      '77.75.156.11',
      '77.75.156.35',
      '77.75.154.128/25',
      '2a02:5180::/32',
    ];
  }

  async createPayment(params: {
    transactionId: string;
    amount: number;
    currency: Currency;
    idempotencyKey: string;
  }): Promise<{
    externalId: string;
    redirectUrl: string;
    meta?: unknown;
  }> {
    const returnUrl = `${this.appHost}/payment/${params.transactionId}/success`;

    try {
      const payment = await this.yookassa.payments.create({
        amount: {
          value: Number(params.amount.toFixed(2)),
          currency: this.mapCurrency(params.currency),
        },
        description: 'Оплата бронирования',
        payment_method_data: {
          type: PaymentMethodsEnum.BANK_CARD,
        },
        confirmation: {
          type: ConfirmationEnum.REDIRECT,
          return_url: returnUrl,
        },
        capture: false,
        metadata: {
          transactionId: params.transactionId,
          bookingId: params.transactionId, // TODO: pass actual booking ID
        },
      });

      const confirmationUrl =
        (payment.confirmation as any)?.confirmation_url ||
        (payment.confirmation as any)?.return_url ||
        returnUrl;

      return {
        externalId: payment.id,
        redirectUrl: confirmationUrl,
        meta: payment,
      };
    } catch (error) {
      this.logger.error(
        { error, transactionId: params.transactionId },
        'YooKassa createPayment failed',
      );

      throw new ForbiddenException('Не удалось создать платеж');
    }
  }

  async getPayment(paymentId: string) {
    return this.yookassa.payments.getById(paymentId);
  }

  async capturePayment(paymentId: string) {
    return this.yookassa.payments.capture(paymentId);
  }

  async cancelPayment(paymentId: string) {
    return this.yookassa.payments.cancel(paymentId);
  }

  async refundPayment(paymentId: string) {
    return this.yookassa.refunds.create({
      payment_id: paymentId,
    });
  }

  async handleWebhook(payload: YooKassaWebhookDto): Promise<PaymentWebhookResult> {
    const transactionId = payload.object.metadata?.transactionId;
    const paymentId = payload.object.id;
    const bookingId = payload.object.metadata?.bookingId;

    if (!transactionId || !bookingId) {
      this.logger.warn('Webhook without transactionId or bookingId', payload);
      throw new ForbiddenException('Invalid webhook payload');
    }

    let status: TransactionStatus = TransactionStatus.PENDING;

    switch (payload.event) {
      case 'payment.waiting_for_capture':
        try {
          await this.capturePayment(paymentId);
          status = TransactionStatus.AUTHORIZED;
        } catch (err) {
          this.logger.error({ err, paymentId }, 'Auto-capture failed');
          status = TransactionStatus.AUTHORIZED;
        }
        break;
      case 'payment.succeeded':
        status = TransactionStatus.SUCCEED;
        break;

      case 'payment.canceled':
        status = TransactionStatus.CANCELED;
        break;

      default:
        this.logger.log(`Unhandled YooKassa event: ${payload.event}`);
    }

    return {
      transactionId,
      paymentId,
      bookingId,
      status,
    };
  }

  verifyWebhookIp(ip: string): void {
    if (!ipRangeCheck(ip, this.allowedIps)) {
      this.logger.warn(`Unauthorized YooKassa IP: ${ip}`);
      throw new ForbiddenException('Unauthorized webhook source');
    }
  }

  private mapCurrency(currency: Currency): CurrencyEnum {
    switch (currency) {
      case Currency.RUB:
        return CurrencyEnum.RUB;
      default:
        throw new Error(`Unsupported currency for YooKassa: ${currency}`);
    }
  }
}
