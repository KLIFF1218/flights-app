import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_METADATA = 'rate-limit-options';

export interface RateLimitOptions {
  points: number;
  duration: number;
}

export const RateLimite = (points: number, duration: number) =>
  SetMetadata(RATE_LIMIT_METADATA, { points, duration });
