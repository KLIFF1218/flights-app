import { forwardRef, Module } from '@nestjs/common';
import { PaymentService } from './services/payment.service';
import { PaymentController } from './controllers/payment.controller';
import { PrismaService } from 'src/infra/db/prisma/prisma.service';
import { YoomoneyModule } from './providers/yoomoney/yoomoney.module';
import { WebhookModule } from './webhook/webhook.module';
import { PaymentHandler } from './payment.handler';
import { MailModule } from 'src/infra/mail/mail.module';
import { PaymentProviderService } from './services/payment-provider.service';
import { TicketingModule } from '../ticketing/ticketing.module';
import { S3Module } from 'src/infra/storage/s3.module';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService, PaymentHandler, PaymentProviderService],
  imports: [YoomoneyModule, forwardRef(() => WebhookModule), MailModule, TicketingModule, S3Module],
  exports: [PaymentService, PaymentHandler],
})
export class PaymentsModule {}
