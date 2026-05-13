import { DocumentBuilder } from '@nestjs/swagger';

export const getSwaggerConfig = () => {
  return new DocumentBuilder()
    .setTitle('MaxAirline API')
    .setVersion(process.env.npm_project_version ?? '1.0.0')
    .build();
};
