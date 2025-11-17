import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import type { Request, Response } from 'express';
import { PinoLoggerService } from 'src/common/logger/pino-logger.service';
import { Authorized } from 'src/common/decorators';
import type { User } from '@prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: PinoLoggerService,
  ) {
    this.logger.setContext(AuthController.name);
  }

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiBody({
    type: RegisterDto,
    description: 'Данные для регистрации пользователя',
  })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Пользователь успешно зарегистрирован. Возвращает accessToken',
  })
  @ApiBadRequestResponse({
    description:
      'Ошибка валидации входных данных (неверный email, короткий пароль и т.д.)',
  })
  @ApiConflictResponse({
    description: 'Пользователь с таким email уже существует',
  })
  async register(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RegisterDto,
  ): Promise<AuthResponseDto> {
    this.logger.log('logger is very good');
    return this.authService.register(dto, res, req);
  }

  @Post('login')
  @ApiOperation({ summary: 'Авторизация пользователя' })
  @ApiBody({
    type: LoginDto,
    description: 'Данные для авторизации пользователя',
  })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Пользователь успешно авторизован. Возвращает accessToken',
  })
  @ApiBadRequestResponse({
    description:
      'Ошибка валидации входных данных (неверный формат email и т.д.)',
  })
  @ApiNotFoundResponse({
    description: 'Неверный email или пароль',
  })
  @ApiUnauthorizedResponse({
    description: 'Ошибка авторизации, неверные данные или отсутствует токен',
  })
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.login(dto, res, req);
  }

  @Post()
  async refresh(@Req() req: Request, @Authorized() user: User) {
    return await this.authService.refresh(req, user.id);
  }
}
