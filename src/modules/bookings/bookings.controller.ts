import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Authorized, Protected, Roles } from 'src/common/decorators';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { BookingResponse } from './dto/booking-response';

interface BookingWithLink {
  booking: BookingResponse;
  payment_link: string;
}

@ApiTags('Bookings')
@ApiBearerAuth()
@Protected()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Roles('USER', 'ADMIN')
  @Post()
  @ApiOperation({
    summary: 'Создание нового бронирования',
    description:
      'Создает новое бронирование с указанными параметрами. Требуется роль USER или ADMIN.',
  })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({
    status: 201,
    description: 'Бронирование успешно создано',
    type: BookingResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные или ошибка создания',
  })
  @ApiResponse({ status: 404, description: 'Рейс не найден' })
  async create(@Body() dto: CreateBookingDto): Promise<BookingWithLink> {
    return await this.bookingsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Получение всех бронирований пользователя',
    description: 'Возвращает список всех бронирований текущего пользователя.',
  })
  @ApiResponse({
    status: 200,
    description: 'Список бронирований успешно получен',
    type: [BookingResponse],
  })
  async getUserBookings(
    @Authorized('id') userId: string,
  ): Promise<BookingResponse[]> {
    return await this.bookingsService.findByAllUser(userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Отмена бронирования',
    description:
      'Отменяет бронирование по его ID и возвращает обновлённые данные.',
  })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор бронирования',
    example: 'booking_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Бронирование успешно отменено',
    type: BookingResponse,
  })
  @ApiResponse({ status: 404, description: 'Бронирование не найдено' })
  async cancel(@Param('id') id: string): Promise<BookingResponse> {
    return await this.bookingsService.cancelBooking(id);
  }
}
