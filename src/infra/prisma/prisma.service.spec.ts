import { Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();

    service.$connect = jest.fn();
    service.$disconnect = jest.fn();

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('должен успешно подключаться к базе данных в onModuleInit', async () => {
    (service.$connect as jest.Mock).mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(service.$connect).toHaveBeenCalledTimes(1);

    expect(Logger.prototype.log).toHaveBeenCalledWith(
      'Initializing DB connection...',
    );

    expect(Logger.prototype.log).toHaveBeenCalledWith(
      '✅Database connected successfully',
    );
  });

  it('должен логировать ошибку и пробрасывать исключение при неудачном подключении', async () => {
    const error = new Error('Connection failed');
    (service.$connect as jest.Mock).mockRejectedValue(error);

    await expect(service.onModuleInit()).rejects.toThrow(error);

    expect(Logger.prototype.error).toHaveBeenCalledWith(
      '❌ Failed to connect to the DB: ',
      error,
    );
  });

  it('должен успешно отключаться от базы данных в onModuleDestroy', async () => {
    (service.$disconnect as jest.Mock).mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(service.$disconnect).toHaveBeenCalledTimes(1);

    expect(Logger.prototype.log).toHaveBeenCalledWith(
      'Closing DB connection...',
    );

    expect(Logger.prototype.log).toHaveBeenCalledWith(
      'Closed database connection successfully',
    );
  });

  it('должен логировать ошибку и пробрасывать исключение при неудачном отключении', async () => {
    const error = new Error('Disconnect failed');
    (service.$disconnect as jest.Mock).mockRejectedValue(error);

    await expect(service.onModuleDestroy()).rejects.toThrow(error);

    expect(Logger.prototype.error).toHaveBeenCalledWith(
      '❌ Failed to close the database connection: ',
      error,
    );
  });
});
