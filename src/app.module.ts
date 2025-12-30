import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { FlightsModule } from './modules/flights/flights.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payment/payment.module';
import { AirportsModule } from './modules/airports/airports.module';
import { InfraModule } from './infra/infra.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './libs/mail/mail.module';
import { RedisModule } from './redis/redis.module';
import { APP_GUARD } from '@nestjs/core';
import { RateLimiterService } from './libs/rate-limiter/rate-limiter-redis.service';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { SeatMapModule } from './modules/seatmaps/seatmap.module';
import { LoggerModule } from 'nestjs-pino';
import { isDev } from './common/utils';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDevelop = isDev(config);

        return {
          pinoHttp: {
            level: config.get('LOG_LEVEL', 'info'),

            transport: isDevelop
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,

            genReqId: (req) =>
              req.headers['x-request-id'] ?? crypto.randomUUID(),
          },
        };
      },
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
    SeatMapModule,
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
