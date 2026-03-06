import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AdminBookingsService } from './admin-bookings.service';
import { AdminBookingsQueryDto } from './dto/admin-bookings-query.dto';
import { BookingStatus, Role } from '@prisma/client';
import { Protected, Roles } from 'src/common/decorators';

@Protected()
@Roles(Role.ADMIN)
@Controller('admin/bookings')
export class AdminBookingsController {
  constructor(private readonly adminBookingsService: AdminBookingsService) {}

  @Get()
  async findAll(@Query() query: AdminBookingsQueryDto) {
    return this.adminBookingsService.findAll(query);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.adminBookingsService.updateStatus(id, status);
  }
}
