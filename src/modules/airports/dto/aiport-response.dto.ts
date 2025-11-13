import { ApiProperty } from '@nestjs/swagger';

export class AirportResponseDto {
  @ApiProperty({
    example: '8f1a8e3e-4e64-48c9-9b7a-9f6b82b3d5d8',
    description: 'Уникальный идентификатор аэропорта (UUID)',
  })
  id: string;

  @ApiProperty({ example: 'JFK', description: 'Код аэропорта (IATA)' })
  code: string;

  @ApiProperty({
    example: 'John F. Kennedy International Airport',
    description: 'Название аэропорта',
  })
  name: string;

  @ApiProperty({ example: 'New York', description: 'Город расположения' })
  city: string;

  @ApiProperty({ example: 'United States', description: 'Страна расположения' })
  country: string;

  @ApiProperty({
    example: '2025-11-13T11:24:00.000Z',
    description: 'Дата создания записи',
  })
  createdAt: string;

  @ApiProperty({
    example: '2025-11-13T11:24:00.000Z',
    description: 'Дата последнего обновления записи',
  })
  updatedAt: string;
}
