import { Injectable } from '@nestjs/common';
import { YooKassaWebhookDto } from './dto/yookassa-webhook.dto';
import { YookassaProvider } from '../providers/yoomoney/yoomoney.service';
import { PaymentHandler } from '../payment.handler';
import { Logger } from 'nestjs-pino';

@Injectable()
export class WebhookService {
  constructor(
    private readonly yookassaProvider: YookassaProvider,
    private readonly paymentHandler: PaymentHandler,
    private readonly logger: Logger,
  ) {}

  async handleYookassa(dto: YooKassaWebhookDto, ip: string) {
    this.yookassaProvider.verifyWebhookIp(ip);

    const result = await this.yookassaProvider.handleWebhook(dto);
    await this.paymentHandler.processResult(result);

    this.logger.log(
      {
        transactionId: result.transactionId,
        status: result.status,
      },
      'YooKassa webhook processed successfully',
    );

    return { ok: true };
  }
}
