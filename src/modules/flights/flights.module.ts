import { Module } from '@nestjs/common';
import { FlightsService } from './flights.service';
import { FlightsController } from './flights.controller';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FlightsCacheService } from './flights-cache.service';

@Module({
  controllers: [FlightsController],
  providers: [FlightsService, PrismaService, FlightsCacheService],
})
export class FlightsModule {}
