import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';

export const Authorized = createParamDecorator(
  (data: keyof User, ctx: ExecutionContext) => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user: User | undefined }>();

    const user = req.user;

    if (!user)
      throw new UnauthorizedException('Пользователь не зарегистрирован');

    return data ? user[data] : user;
  },
);
