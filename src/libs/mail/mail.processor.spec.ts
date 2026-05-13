import { Logger } from '@nestjs/common';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';
import { Job } from 'bullmq';

describe('MailProcessor', () => {
  let processor: MailProcessor;
  let mailServiceMock: jest.Mocked<MailService>;

  beforeEach(() => {
    mailServiceMock = {
      sendMail: jest.fn(),
    } as any;

    processor = new MailProcessor(mailServiceMock);

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('должен корректно обрабатывать задачу и отправлять письмо', async () => {
    const job = {
      data: {
        email: 'test@example.com',
        subject: 'Test subject',
      },
    } as Job;

    mailServiceMock.sendMail.mockResolvedValue(undefined);

    await processor.process(job);

    expect(mailServiceMock.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Test subject',
    });

    expect(Logger.prototype.error).not.toHaveBeenCalled();
  });

  it('должен логировать ошибку, если sendMail выбрасывает исключение', async () => {
    const job = {
      data: {
        email: 'failed@example.com',
        subject: 'Failed',
      },
    } as Job;

    mailServiceMock.sendMail.mockRejectedValue(new Error('SMTP error'));

    await processor.process(job);

    expect(Logger.prototype.error).toHaveBeenCalledWith(
      'Ошибка при отправке письма',
    );
  });
});
