import { Module } from '@nestjs/common';
import { AdminBookingsService } from './admin-bookings.service';
import { AdminBookingsController } from './admin-bookings.controller';

@Module({
  controllers: [AdminBookingsController],
  providers: [AdminBookingsService],
})
export class AdminBookingsModule {}
