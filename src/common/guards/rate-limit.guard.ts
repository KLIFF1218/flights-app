import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RateLimiterService } from '../../infra/rate-limiter/rate-limiter-redis.service';
import { RATE_LIMIT_METADATA, RateLimitOptions } from '../decorators/rate-limit.decorator';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from '@prisma/client';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimiter: RateLimiterService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: User }>();

    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!rateLimitOptions) return true;

    const limiter = this.rateLimiter.createLimiter(rateLimitOptions);

    const key = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;

    try {
      await this.rateLimiter.consume(limiter, key);
      return true;
    } catch {
      throw new ForbiddenException('Too many requests');
    }
  }
}
