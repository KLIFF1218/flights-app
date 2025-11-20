import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { FlightsModule } from './modules/flights/flights.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payment/payment.module';
import { AirportsModule } from './modules/airports/airports.module';
import { InfraModule } from './infra/infra.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './libs/mail/mail.module';
import { PinoLoggerModule } from './common/logger/pino-logger.module';
import { RedisModule } from './redis/redis.module';
import { APP_GUARD } from '@nestjs/core';
import { RateLimiterService } from './libs/rate-limiter/rate-limiter-redis.service';
import { RateLimitGuard } from './common/guards/rate-limit.guard';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      prettyPrint: process.env.NODE_ENV !== 'production',
      name: 'MaxAirline',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    FlightsModule,
    BookingsModule,
    PaymentsModule,
    AirportsModule,
    InfraModule,
    AuthModule,
    MailModule,
    RedisModule,
  ],
  providers: [
    RateLimiterService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
