import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards';

export const Protected = () =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard));
