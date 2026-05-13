import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreatePaymentDto, TripClass } from './dto/create-payment.dto';
import {
  Booking,
  Currency,
  PaymentProvider,
  Prisma,
  StatusBooking,
  Transaction,
  TransactionStatus,
} from '@prisma/client';
import { YoomoneyService } from './providers/yoomoney/yoomoney.service';
import { ConfirmationEnum, CreatePaymentResponse } from 'nestjs-yookassa';

@Injectable()
export class PaymentService {
  private logger = new Logger(PaymentService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly yoomoneyService: YoomoneyService,
  ) {}

  async create(
    tripClass: string,
    flightId: string,
    provider: PaymentProvider,
    userId: string,
    currency: Currency,
    booking: Booking,
  ) {
    const flight = await this.prismaService.flight.findUnique({
      where: {
        id: flightId,
      },
    });

    if (!flight) throw new NotFoundException('Рейс не найден');
    let transaction: Transaction | undefined;

    try {
      transaction = await this.prismaService.transaction.create({
        data: {
          amount: flight.price,
          currency,
          tripClass,
          bookingId: booking.id,
          userId,
          provider,
        },
      });

      let payment: CreatePaymentResponse;

      switch (provider) {
        case PaymentProvider.YOOKASSA: {
          payment = await this.yoomoneyService.createPayment(
            transaction.amount,
            transaction.id,
            booking.id,
          );
          break;
        }
        default:
          throw new BadRequestException('Неподдерживаемый способ оплаты');
      }

      await this.prismaService.transaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          providerMeta: payment as unknown as Prisma.InputJsonValue,
        },
      });

      const confirmation = payment.confirmation;
      if (confirmation?.type === ConfirmationEnum.REDIRECT) {
        return {
          payment_link: confirmation.confirmation_url,
          booking,
        };
      }
      throw new BadRequestException('Не удалось получить ссылку на оплату');
    } catch (error) {
      this.logger.error('Ошибка при создании платежа: ', error);

      try {
        if (transaction) {
          await this.prismaService.transaction.update({
            where: {
              id: transaction.id,
            },
            data: {
              status: TransactionStatus.FAILED,
            },
          });
        }
      } catch (e) {
        this.logger.error('Ошибка при обновлении статуса транзакции: ', e);
      }

      try {
        await this.prismaService.booking.update({
          where: {
            id: booking.id,
          },
          data: {
            status: StatusBooking.FAILED,
          },
        });
      } catch (e) {
        this.logger.error('Ошибка при обновлении статуса бронирования: ', e);
      }

      try {
        if (booking) {
          await this.prismaService.flight.update({
            where: {
              id: booking.flightId,
            },
            data: {
              availableSeats: { increment: booking.seats },
            },
          });
        }
      } catch (e) {
        this.logger.error('Ошибка при обновлении доступных мест рейса: ', e);
      }
      throw new BadRequestException('Не удалось создать платеж');
    }
  }
}
