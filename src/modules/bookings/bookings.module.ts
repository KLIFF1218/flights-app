import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PaymentsModule } from '../payment/payment.module';
import { FlightBookingController } from './flight.booking.controller';
import { FlightBookingService } from './flight.booking.service';
import { FlightsModule } from '../flights/flights.module';

@Module({
  imports: [PaymentsModule, FlightsModule],
  controllers: [BookingsController, FlightBookingController],
  providers: [BookingsService, FlightBookingService],
})
export class BookingsModule {}
