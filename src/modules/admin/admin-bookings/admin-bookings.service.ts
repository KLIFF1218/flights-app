import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/db/prisma/prisma.service';
import { AdminBookingsQueryDto } from './dto/admin-bookings-query.dto';
import { BookingStatus, Prisma } from '@prisma/client';

@Injectable()
export class AdminBookingsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(query: AdminBookingsQueryDto) {
    const { search, status, page, limit } = query;

    const where: Prisma.BookingWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { pnrLocator: { contains: search, mode: 'insensitive' } },
        {
          user: {
            firstName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          user: {
            lastName: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prismaService.booking.findMany({
        where,
        include: {
          user: true,
          transaction: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prismaService.booking.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(id: string, status: BookingStatus) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prismaService.booking.update({
      where: { id },
      data: { status },
    });
  }
}
