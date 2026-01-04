import { Module } from '@nestjs/common';
import { PrismaModule } from './db/prisma/prisma.module';
import { HttpModule } from './http/http.module';
import { RateLimiterModule } from './rate-limiter/rate-limiter.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [PrismaModule, HttpModule, RateLimiterModule, MailModule],
})
export class InfraModule {}
