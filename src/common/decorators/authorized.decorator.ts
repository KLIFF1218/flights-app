import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';

export const Authorized = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: User }>();

    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    return data ? user[data] : user;
  },
);
