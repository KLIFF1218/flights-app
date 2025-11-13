import { MailerOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export const getMailerConfig = (
  configService: ConfigService,
): MailerOptions => {
  return {
    transport: {
      host: configService.getOrThrow<string>('MAIL_HOST'),
      port: configService.getOrThrow<number>('MAIL_PORT'),
      auth: {
        user: configService.getOrThrow<string>('MAIL_LOGIN'),
        password: configService.getOrThrow<string>('MAIL_PASSWORD'),
      },
    },
    defaults: {
      from: `MaxAirline ${configService.getOrThrow<string>('MAIL_LOGIN')}`,
    },
  };
};
