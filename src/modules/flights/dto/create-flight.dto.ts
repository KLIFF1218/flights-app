import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFlightDto {
  @ApiProperty({
    example: 'SU1234',
    description: 'Уникальный номер рейса (flight number)',
  })
  @IsNotEmpty()
  @IsString()
  flightNumber: string;

  @ApiProperty({
    example: 'DME',
    description: 'ID аэропорта вылета',
  })
  @IsNotEmpty()
  @IsString()
  departureAirportId: string;

  @ApiProperty({
    example: 'JFK',
    description: 'ID аэропорта прибытия',
  })
  @IsNotEmpty()
  @IsString()
  arrivalAirportId: string;

  @ApiProperty({
    example: 35000,
    description: 'Цена за билет (в выбранной валюте)',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 180,
    description: 'Количество доступных мест',
  })
  @IsNotEmpty()
  @IsNumber()
  availableSeats: number;

  @ApiProperty({
    example: '2025-12-10T08:30:00.000Z',
    description: 'Дата и время вылета (ISO формат)',
  })
  @IsNotEmpty()
  departureTime: string;

  @ApiProperty({
    example: '2025-12-10T14:50:00.000Z',
    description: 'Дата и время прибытия (ISO формат)',
  })
  @IsNotEmpty()
  arrivalTime: string;

  @ApiProperty({
    example: 'Aeroflot',
    description: 'Название авиакомпании',
  })
  @IsNotEmpty()
  @IsString()
  airline: string;
}
