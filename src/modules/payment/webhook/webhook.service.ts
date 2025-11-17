import { Injectable } from '@nestjs/common';
import { YoomoneyService } from '../providers/yoomoney/yoomoney.service';
import { YooKassaWebhookDto } from './dto/yookassa-webhook.dto';
import { PaymentHandler } from '../payment.handler';

@Injectable()
export class WebhookService {
  constructor(
    private readonly yoomoneyService: YoomoneyService,
    private readonly paymentHandler: PaymentHandler,
  ) {}
  async handleYookassa(dto: YooKassaWebhookDto, ip: string) {
    this.yoomoneyService.verifyWebhook(ip);
    const result = await this.yoomoneyService.handleWebhook(dto);
    return await this.paymentHandler.processResult(result);
  }
}
