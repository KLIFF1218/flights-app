import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { LoggerModule } from 'nestjs-pino';
import { BullModule } from '@nestjs/bullmq';

import { UsersModule } from './modules/users/users.module';
import { FlightsModule } from './modules/flights/flights.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payment/payment.module';
import { AirportsModule } from './modules/airports/airports.module';
import { SeatMapModule } from './modules/seatmaps/seatmap.module';
import { AuthModule } from './modules/auth/auth.module';

import { InfraModule } from './infra/infra.module';
import { MailModule } from './infra/mail/mail.module';
import { RedisModule } from './redis/redis.module';

import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { RateLimiterService } from './infra/rate-limiter/rate-limiter-redis.service';

import { isDev } from './common/utils';
import { TicketingModule } from './modules/ticketing/ticketing.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dev = isDev(config);

        return {
          pinoHttp: {
            level: config.get('LOG_LEVEL', 'info'),

            transport: dev
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,

            genReqId: (req) => req.headers['x-request-id'] ?? crypto.randomUUID(),

            autoLogging: false,
          },
        };
      },
    }),

    InfraModule,
    RedisModule,
    MailModule,

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow('REDIS_HOST'),
          port: config.getOrThrow('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
          tls: config.get('REDIS_TLS') === 'true' ? {} : undefined,
        },
      }),
    }),

    AuthModule,
    UsersModule,
    FlightsModule,
    BookingsModule,
    PaymentsModule,
    AirportsModule,
    SeatMapModule,
    TicketingModule,
  ],

  providers: [
    RateLimiterService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    GlobalExceptionFilter,
  ],
})
export class AppModule {}
