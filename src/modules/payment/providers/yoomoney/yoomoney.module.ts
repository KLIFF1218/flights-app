import { Module } from '@nestjs/common';
import { YoomoneyService } from './yoomoney.service';
import { YookassaModule } from 'nestjs-yookassa';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getYookassaConfig } from 'src/config/yookassa.config';

@Module({
  imports: [
    YookassaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getYookassaConfig,
      inject: [ConfigService],
    }),
  ],
  providers: [YoomoneyService],
  exports: [YoomoneyService],
})
export class YoomoneyModule {}
