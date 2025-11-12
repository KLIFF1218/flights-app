import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from './mail.service';

@Processor('mail')
@Injectable()
export class MailProcessor extends WorkerHost {
  private logger = new Logger(MailProcessor.name);
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<{ email: string; subject: string }>) {
    const { email, subject } = job.data;
    try {
      await this.mailService.sendMail({
        to: email,
        subject,
      });
    } catch (error) {
      this.logger.error('Ошибка при отправке письма');
    }
  }
}
