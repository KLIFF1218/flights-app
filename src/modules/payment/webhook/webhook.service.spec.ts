import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { YoomoneyService } from '../providers/yoomoney/yoomoney.service';
import { PaymentHandler } from '../payment.handler';
import { YooKassaWebhookDto } from './dto/yookassa-webhook.dto';

describe('WebhookService', () => {
  let service: WebhookService;
  let yoomoneyService: jest.Mocked<YoomoneyService>;
  let paymentHandler: jest.Mocked<PaymentHandler>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: YoomoneyService,
          useValue: {
            verifyWebhook: jest.fn(),
            handleWebhook: jest.fn(),
          },
        },
        {
          provide: PaymentHandler,
          useValue: {
            processResult: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(WebhookService);
    yoomoneyService = module.get(YoomoneyService);
    paymentHandler = module.get(PaymentHandler);
  });

  it('should verify IP, process webhook and pass result to payment handler', async () => {
    const dto: YooKassaWebhookDto = {
      type: 'payment.succeeded',
      object: { id: '1' },
    };

    const ip = '127.0.0.1';

    const mockResult = {
      transactionId: 't1',
      bookingId: 'b1',
      paymentId: 'p1',
      status: 'SUCCEED',
    };

    yoomoneyService.handleWebhook.mockResolvedValue(mockResult);

    await service.handleYookassa(dto, ip);

    expect(yoomoneyService.verifyWebhook).toHaveBeenCalledWith(ip);
    expect(yoomoneyService.handleWebhook).toHaveBeenCalledWith(dto);
    expect(paymentHandler.processResult).toHaveBeenCalledWith(mockResult);
  });

  it('should throw if verifyWebhook throws', async () => {
    const dto: YooKassaWebhookDto = {
      type: 'payment.waiting_for_capture',
      object: { id: '2' },
    };

    const ip = '10.0.0.1';

    yoomoneyService.verifyWebhook.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(service.handleYookassa(dto, ip)).rejects.toThrow(
      'invalid signature',
    );

    expect(yoomoneyService.handleWebhook).not.toHaveBeenCalled();
    expect(paymentHandler.processResult).not.toHaveBeenCalled();
  });

  it('should throw if handleWebhook fails', async () => {
    const dto: YooKassaWebhookDto = {
      type: 'payment.canceled',
      object: { id: '3' },
    };

    const ip = '8.8.8.8';

    yoomoneyService.handleWebhook.mockRejectedValue(
      new Error('Webhook parse failed'),
    );

    await expect(service.handleYookassa(dto, ip)).rejects.toThrow(
      'Webhook parse failed',
    );

    expect(paymentHandler.processResult).not.toHaveBeenCalled();
  });
});
