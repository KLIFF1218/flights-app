import type { ConfigService } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';

export const getJwtConfig = (configService: ConfigService): JwtModuleOptions => {
  return {
    secret: configService.getOrThrow<string>('JWT_SECRET'),
    signOptions: {
      algorithm: 'HS256',
    },
    verifyOptions: {
      algorithms: ['HS256'],
      ignoreExpiration: false,
    },
  };
};
