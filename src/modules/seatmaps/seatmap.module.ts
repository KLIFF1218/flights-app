import { Module } from '@nestjs/common';
import { SeatmapsController } from './seatmap.controller';
import { SeatMapsService } from './seatmap.service';
import { FlightsModule } from '../flights/flights.module';

@Module({
  imports: [FlightsModule],
  controllers: [SeatmapsController],
  providers: [SeatMapsService],
})
export class SeatMapModule {}
