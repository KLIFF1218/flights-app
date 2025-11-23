import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PinoLoggerService } from 'src/common/logger/pino-logger.service';
import { hash, verify } from 'argon2';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwt: jest.Mocked<JwtService>;
  let config: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<PinoLoggerService>;

  let req: any;
  let res: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
      },
    } as any;

    jwt = {
      sign: jest.fn(),
    } as any;

    config = {
      getOrThrow: jest.fn((key) => {
        if (key === 'JWT_EXPIRES_ACCESS_TOKEN') return '1h';
        if (key === 'JWT_EXPIRES_REFRESH_TOKEN') return '30d';
        if (key === 'COOKIES_DOMAIN') return 'localhost';
      }),
    } as any;

    logger = {
      setContext: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    } as any;

    req = {
      headers: { 'user-agent': 'test-agent' },
      ip: '1.1.1.1',
      socket: { remoteAddress: '1.1.1.1' },
      cookies: {},
    };

    res = {
      cookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
        { provide: PinoLoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('должен выбросить ConflictException если пользователь существует', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1' } as any);

      await expect(
        service.register(
          { email: 'a@a.com', password: '123', fullName: 'Max' },
          res,
          req,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('должен создать пользователя и вызвать auth()', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (hash as jest.Mock).mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({
        id: '1',
        email: 'a@a.com',
      } as any);

      const authSpy = jest
        .spyOn<any, any>(service as any, 'auth')
        .mockResolvedValue({ accessToken: 'a', accessMaxAge: 1 });

      const resData = await service.register(
        { email: 'a@a.com', password: '123', fullName: 'Max' },
        res,
        req,
      );

      expect(prisma.user.create).toHaveBeenCalled();
      expect(authSpy).toHaveBeenCalled();
      expect(resData).toEqual({ accessToken: 'a', accessMaxAge: 1 });
    });
  });

  describe('login', () => {
    it('должен выбросить NotFoundException если пользователя нет', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'a@a.com', password: '123' }, res, req),
      ).rejects.toThrow(NotFoundException);
    });

    it('должен выбросить NotFoundException если пароль неверный', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        password: 'aaa',
      } as any);
      (verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'a@a.com', password: '123' }, res, req),
      ).rejects.toThrow(NotFoundException);
    });

    it('должен логинить и вызвать auth()', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        password: 'hashed',
      } as any);

      (verify as jest.Mock).mockResolvedValue(true);

      const authSpy = jest
        .spyOn<any, any>(service as any, 'auth')
        .mockResolvedValue({ accessToken: 'a', accessMaxAge: 1 });

      const result = await service.login(
        { email: 'a@a.com', password: '123' },
        res,
        req,
      );

      expect(authSpy).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: 'a', accessMaxAge: 1 });
    });
  });

  describe('auth', () => {
    it('должен вызывать generateTokens и saveTokens', async () => {
      const user = { id: '1' } as any;

      jest.spyOn<any, any>(service as any, 'generateTokens').mockResolvedValue({
        accessToken: 'tokenA',
        refreshToken: 'tokenR',
        accessMaxAge: 100,
        refreshMaxAge: 200,
      });

      const saveSpy = jest
        .spyOn<any, any>(service as any, 'saveTokens')
        .mockImplementation(() => {});

      const result = await (service as any).auth(user, res, req);

      expect(saveSpy).toHaveBeenCalledWith(res, 'tokenR', 200);
      expect(result).toEqual({
        accessToken: 'tokenA',
        accessMaxAge: 100,
      });
    });
  });

  describe('generateTokens', () => {
    it('должен создавать access, refresh токены и записывать refresh в БД', async () => {
      const user = { id: '1' } as any;

      jwt.sign.mockImplementation((payload, opts) => {
        if (opts.expiresIn === service['JWT_EXPIRES_ACCESS_TOKEN'])
          return 'access123';
        return 'refresh123';
      });

      (hash as jest.Mock).mockResolvedValue('hashedRefreshToken');

      prisma.refreshToken.create.mockResolvedValue({ id: 'r1' } as any);

      const result = await (service as any).generateTokens(
        user,
        'agent',
        '1.1.1.1',
      );

      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(prisma.refreshToken.create).toHaveBeenCalled();

      expect(result).toEqual({
        accessToken: 'access123',
        refreshToken: 'refresh123',
        accessMaxAge: service['JWT_EXPIRES_ACCESS_TOKEN'],
        refreshMaxAge: service['JWT_EXPIRES_REFRESH_TOKEN'],
      });
    });
  });

  describe('saveTokens', () => {
    it('должен устанавливать refreshToken в cookie', () => {
      (service as any).saveTokens(res, 'r123', 1000);

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'r123',
        expect.objectContaining({
          domain: 'localhost',
          sameSite: 'lax',
          httpOnly: true,
          maxAge: 1000,
        }),
      );
    });
  });
});
