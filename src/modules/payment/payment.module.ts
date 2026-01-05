import { forwardRef, Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from 'src/infra/db/prisma/prisma.service';
import { YoomoneyModule } from './providers/yoomoney/yoomoney.module';
import { WebhookModule } from './webhook/webhook.module';
import { PaymentHandler } from './payment.handler';
import { MailModule } from 'src/infra/mail/mail.module';

@Module({
  providers: [PaymentService, PrismaService, PaymentHandler],
  imports: [YoomoneyModule, forwardRef(() => WebhookModule), MailModule],
  exports: [PaymentService, PaymentHandler],
})
export class PaymentsModule {}
