import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class BookingsService {
  private logger = new Logger(BookingsService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async create(dto: CreateBookingDto) {
    try {
      const {
        flightId,
        seats,
        passengerEmail,
        passengerLastName,
        passengerName,
        userId,
        tripClass,
        paymentMethod,
        currency,
      } = dto;
      const flight = await this.prismaService.flight.findUnique({
        where: { id: flightId },
      });

      if (!flight) throw new NotFoundException('Рейс не найден');

      if (flight.availableSeats < seats)
        throw new BadRequestException('Нет доступных мест');

      const result = await this.prismaService.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            passengerEmail,
            passengerLastName,
            passengerName,
            flightId,
            userId,
            seats,
            tripClass,
          },
        });

        await tx.flight.update({
          where: {
            id: flightId,
          },
          data: {
            availableSeats: { decrement: seats },
          },
        });

        const bookingNumber = `BK-${new Date().getFullYear()}-${booking.id.slice(8, 16)}`;

        const updatedBooking = await tx.booking.update({
          where: {
            id: booking.id,
          },
          data: {
            bookingNumber,
          },
        });

        return updatedBooking;
      });

      return await this.paymentService.create(
        tripClass,
        flightId,
        paymentMethod,
        userId,
        currency,
        result,
      );
    } catch (error) {
      this.logger.error('Ошибка при создании бронирования: ', error, dto);
      throw new BadRequestException('Не удалось создать бронирование');
    }
  }

  async findByAllUser(userId: string) {
    return await this.prismaService.booking.findMany({
      where: {
        userId,
      },
      include: {
        flight: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async cancelBooking(bookingId: string) {
    const booking = await this.prismaService.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        flight: true,
      },
    });

    if (!booking) throw new NotFoundException(`Брони с таким ID не существует`);

    await this.prismaService.flight.update({
      where: {
        id: booking?.flight.id,
      },
      data: {
        availableSeats: booking.flight.availableSeats + booking?.seats,
      },
    });

    return await this.prismaService.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: 'CANCELED',
      },
    });
  }
}
