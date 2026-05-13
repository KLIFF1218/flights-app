import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { YooKassaWebhookDto } from './dto/yookassa-webhook.dto';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}
  @Post('yookassa')
  @HttpCode(HttpStatus.OK)
  async handleYookassa(@Body() dto: YooKassaWebhookDto, @Ip() ip: string) {
    console.log('webhook');
    return this.webhookService.handleYookassa(dto, ip);
  }
}
