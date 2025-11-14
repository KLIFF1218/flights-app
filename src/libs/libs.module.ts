import { Module } from '@nestjs/common';
import { MailModule } from './mail/mail.module';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getBullmqConfig } from 'src/config/bullmq.config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getBullmqConfig,
      inject: [ConfigService],
    }),
    MailModule,
  ],
})
export class LibsModule {}
