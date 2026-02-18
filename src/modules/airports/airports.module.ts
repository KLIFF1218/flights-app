import { Module } from '@nestjs/common';
import { AirportsService } from './services/airports.service';
import { AirportsController } from './controllers/airports.controller';
import { FlightsModule } from '../flights/flights.module';
import { InfraModule } from 'src/infra/infra.module';

@Module({
  imports: [FlightsModule, InfraModule],
  controllers: [AirportsController],
  providers: [AirportsService],
})
export class AirportsModule {}
