import { Module } from '@nestjs/common';
import { AirportsService } from './airports.service';
import { AirportsController } from './airports.controller';
import { FlightsModule } from '../flights/flights.module';
import { InfraModule } from 'src/infra/infra.module';

@Module({
  imports: [FlightsModule, InfraModule],
  controllers: [AirportsController],
  providers: [AirportsService],
})
export class AirportsModule {}
