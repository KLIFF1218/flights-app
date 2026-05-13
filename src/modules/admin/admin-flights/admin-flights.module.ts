import { Module } from '@nestjs/common';
import { FlightsController } from './admin-flights.controller';
import { FlightsService } from './admin-flights.service';

@Module({
  controllers: [FlightsController],
  providers: [FlightsService],
})
export class AdminFlightsModule {}
