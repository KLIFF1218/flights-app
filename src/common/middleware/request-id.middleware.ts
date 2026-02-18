import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestIdMiddleware(
  req: Request & { requestId?: string },
  res: Response,
  next: NextFunction,
) {
  const header = req.headers['x-request-id'] ?? req.headers['x-correlation-id'];
  const id = typeof header === 'string' && header.length > 0 ? header : randomUUID();
  req.headers['x-request-id'] = id;
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
