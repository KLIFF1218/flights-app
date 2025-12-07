import { Logger } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { Queue } from 'bullmq';

describe('MailService', () => {
  let service: MailService;
  let queueMock: jest.Mocked<Queue>;
  let mailerMock: jest.Mocked<MailerService>;

  beforeEach(() => {
    queueMock = {
      add: jest.fn(),
    } as any;

    mailerMock = {
      sendMail: jest.fn(),
    } as any;

    service = new MailService(queueMock, mailerMock);

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('должен помещать задачу в очередь при успешном бронировании', async () => {
    const user = { email: 'test@example.com' } as any;
    const booking = { bookingNumber: 'ABC123' } as any;

    await service.sendSuccessMail(user, booking);

    expect(queueMock.add).toHaveBeenCalledWith(
      'send-email',
      {
        email: 'test@example.com',
        subject: 'Бронирование №ABC123 прошло успешно',
      },
      {
        removeOnComplete: true,
      },
    );
  });

  it('должен помещать задачу в очередь при неудачном бронировании', async () => {
    const user = { email: 'test@example.com' } as any;

    await service.sendFailedMail(user);

    expect(queueMock.add).toHaveBeenCalledWith(
      'send-email',
      {
        email: 'test@example.com',
        subject: 'Не удалось забронировать авибилеты',
      },
      {
        removeOnComplete: true,
      },
    );
  });

  it('должен отправлять письмо через mailerService', async () => {
    const options = { to: 'test@example.com', subject: 'Test' };

    mailerMock.sendMail.mockResolvedValue(undefined);

    await service.sendMail(options);

    expect(mailerMock.sendMail).toHaveBeenCalledWith(options);
    expect(Logger.prototype.error).not.toHaveBeenCalled();
  });

  it('должен логировать ошибку при сбое отправки письма', async () => {
    const options = { to: 'a', subject: 'b' };
    const error = new Error('SMTP error');

    mailerMock.sendMail.mockRejectedValue(error);

    await service.sendMail(options);

    expect(Logger.prototype.error).toHaveBeenCalledWith(
      'Ошибка при оправке письма: ',
      error,
    );
  });
});
