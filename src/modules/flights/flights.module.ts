import { Module } from '@nestjs/common';
import { FlightsService } from './flights.service';
import { FlightsController } from './flights.controller';
import { PrismaService } from 'src/infra/db/prisma/prisma.service';
import { RedisModule } from 'src/redis/redis.module';
import { AmadeusService } from './amadeus.service';
import { FlightsPricingService } from './flight-pricing.service';
import { FlightPricingController } from './flight-pricing.controller';
import { FlightsSearchStore } from './flights-cache.service';
import { AmadeusAuthService } from '../../infra/http/amadeus/amadeus-auth.service';
import { AmadeusHttpClient } from 'src/infra/http/amadeus/amadeus-http-client.service';

@Module({
  imports: [RedisModule],
  controllers: [FlightsController, FlightPricingController],
  providers: [
    FlightsService,
    PrismaService,
    AmadeusService,
    FlightsPricingService,
    FlightsSearchStore,
    AmadeusAuthService,
    AmadeusHttpClient,
    FlightsSearchStore,
  ],
  exports: [AmadeusService, AmadeusHttpClient, FlightsSearchStore],
})
export class FlightsModule {}
