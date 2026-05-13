import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Booking, User } from '@prisma/client';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
  private logger = new Logger(MailService.name);
  constructor(
    @InjectQueue('mail') private queue: Queue,
    private readonly mailerService: MailerService,
  ) {}

  async sendSuccessMail(user: User, booking: Booking) {
    await this.queue.add(
      'send-email',
      {
        email: user.email,
        subject: `Бронирование №${booking.bookingNumber} прошло успешно`,
      },
      {
        removeOnComplete: true,
      },
    );
  }

  async sendFailedMail(user: User) {
    await this.queue.add(
      'send-email',
      {
        email: user.email,
        subject: 'Не удалось забронировать авибилеты',
      },
      {
        removeOnComplete: true,
      },
    );
  }

  async sendMail(options: ISendMailOptions) {
    try {
      await this.mailerService.sendMail(options);
    } catch (error) {
      this.logger.error('Ошибка при оправке письма: ', error);
    }
  }
}
