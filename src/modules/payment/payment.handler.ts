import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentWebhookResult } from './interfaces/payment-webhook-result.dto';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  Booking,
  StatusBooking,
  Transaction,
  TransactionStatus,
  User,
} from '@prisma/client';
import { MailService } from 'src/libs/mail/mail.service';

@Injectable()
export class PaymentHandler {
  private logger = new Logger(PaymentHandler.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
  ) {}
  async processResult(result: PaymentWebhookResult) {
    const { bookingId, paymentId, status, transactionId } = result;
    let updatedBooking: Booking | undefined;
    let updatedTransaction: (Transaction & { user: User }) | undefined;

    try {
      await this.prismaService.$transaction(async (tx) => {
        updatedTransaction = await tx.transaction.update({
          where: {
            id: transactionId,
          },
          data: {
            status,
            externalId: paymentId,
          },
          include: {
            user: true,
          },
        });

        if (!updatedTransaction)
          throw new NotFoundException('Транзакция не найдена');

        if (status === TransactionStatus.SUCCEED) {
          updatedBooking = await tx.booking.update({
            where: {
              id: bookingId,
            },
            data: {
              status: StatusBooking.CONFIRMED,
            },
          });

          this.logger.log('Оплата успешно обработана');
        } else if (status === TransactionStatus.CANCELED) {
          updatedBooking = await tx.booking.update({
            where: {
              id: bookingId,
            },
            data: {
              status: StatusBooking.CANCELED,
            },
          });

          await tx.flight.update({
            where: {
              id: updatedBooking.flightId,
            },
            data: {
              availableSeats: { increment: updatedBooking.seats },
            },
          });

          this.logger.log('Оплата отменена и бронирование отменено');
        } else {
          this.logger.error('Статус транзакции не изменен');
        }
      });
    } catch (error) {
      this.logger.error('Ошибка при обработке результата платежа: ', error);
    }

    try {
      if (
        status === TransactionStatus.SUCCEED &&
        updatedBooking &&
        updatedTransaction
      ) {
        await this.mailService.sendSuccessMail(
          updatedTransaction.user,
          updatedBooking,
        );
      }
    } catch (error) {
      this.logger.error('Ошибка при отправке письма: ', error);
    }
  }
}
