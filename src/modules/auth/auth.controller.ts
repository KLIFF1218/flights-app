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
import { AuthResponseDto } from './dto/auth.response.dto';
import type { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import { VkIdAuthDto } from './dto/vk-id.auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: Logger,
  ) {}

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
    description: 'Ошибка валидации входных данных (неверный email, короткий пароль и т.д.)',
  })
  @ApiConflictResponse({
    description: 'Пользователь с таким email уже существует',
  })
  async register(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RegisterDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(dto, req, res);
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
    description: 'Ошибка валидации входных данных (неверный формат email и т.д.)',
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
    return this.authService.login(dto, req, res);
  }

  @Post('vkontakke')
  async vkLogin(@Body() dto: VkIdAuthDto) {
    return this.authService.exchangeVkCode(dto);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return await this.authService.refresh(req, res);
  }
}
