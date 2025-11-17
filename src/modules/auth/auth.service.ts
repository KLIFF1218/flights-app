import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { hash, verify } from 'argon2';
import { JwtPayload } from './interfaces';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { Request, Response } from 'express';
import { isDev } from 'src/common/utils/is-dev';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly JWT_EXPIRES_ACCESS_TOKEN: number;
  private readonly JWT_EXPIRES_REFRESH_TOKEN: number;
  private readonly COOKIES_DOMAIN: string;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.JWT_EXPIRES_ACCESS_TOKEN = ms(
      configService.getOrThrow<ms.StringValue>('JWT_EXPIRES_ACCESS_TOKEN'),
    );
    this.JWT_EXPIRES_REFRESH_TOKEN = ms(
      configService.getOrThrow<ms.StringValue>('JWT_EXPIRES_REFRESH_TOKEN'),
    );
    this.COOKIES_DOMAIN = configService.getOrThrow<string>('COOKIES_DOMAIN');
  }

  async register(dto: RegisterDto, res: Response, req) {
    const { email, password, fullName } = dto;
    const exist = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (exist)
      throw new ConflictException(
        'Пользователь с таким email уже зарегистрирован',
      );

    const hashedPassword = await hash(password);

    const user = await this.prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
      },
    });

    return this.auth(user, res, req);
  }

  async login(dto: LoginDto, res: Response, req: Request) {
    const { email, password } = dto;
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) throw new NotFoundException('Неверный логин или пароль');

    const isValidPassword = await verify(user.password, password);

    if (!isValidPassword)
      throw new NotFoundException('Неверный логин или пароль');

    return this.auth(user, res, req);
  }

  async refresh(req: Request, userId: string) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) throw new UnauthorizedException('Отсутсвует токен');

    const userAgent = req.headers['user-agent'];
    const ip =
      (Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : req.headers['x-forwarded-for']) ||
      req.socket.remoteAddress ||
      req.ip;

    // доделать потом нужно логику проверки рефреша, когда несколько устройств

  }

  private async auth(user: User, res: Response, req: Request) {
    const userAgent = req.headers['user-agent'];
    const ip =
      (Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : req.headers['x-forwarded-for']) ||
      req.socket.remoteAddress ||
      req.ip;
    const { accessToken, refreshToken, refreshMaxAge, accessMaxAge } =
      await this.generateTokens(user, userAgent, ip);
    this.saveTokens(res, refreshToken, refreshMaxAge);

    return {
      accessToken,
      accessMaxAge,
    };
  }

  private async generateTokens(user: User, userAgent, ip) {
    const payload: JwtPayload = { id: user.id };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_EXPIRES_ACCESS_TOKEN,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_EXPIRES_REFRESH_TOKEN,
    });

    const accessMaxAge = this.JWT_EXPIRES_ACCESS_TOKEN;
    const refreshMaxAge = this.JWT_EXPIRES_REFRESH_TOKEN;

    const hashedRefreshToken = await hash(refreshToken);

    const refresh = await this.prismaService.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashedRefreshToken,
        expiresAt: new Date(Date.now() + refreshMaxAge),
        deviceInfo: userAgent,
        ip,
      },
    });

    return {
      accessToken,
      refreshToken,
      refreshMaxAge,
      accessMaxAge,
    };
  }

  private saveTokens(
    res: Response,
    refreshToken: string,
    refreshMaxAge: number,
  ) {
    res.cookie('refreshToken', refreshToken, {
      domain: this.COOKIES_DOMAIN,
      sameSite: 'lax',
      secure: !isDev,
      httpOnly: true,
      maxAge: refreshMaxAge,
    });
  }
}
