import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TripClass {
  ECONOMY = 'Y',
  COMFORT = 'W',
  BUSINESS = 'C',
  FIRST = 'F',
}

export class DirectionDto {
  @ApiProperty({ example: 'DME', description: 'Аэропорт вылета' })
  @IsString()
  origin: string;

  @ApiProperty({ example: 'JFK', description: 'Аэропорт назначения' })
  @IsString()
  destination: string;

  @ApiProperty({
    example: '2025-12-10',
    description: 'Дата вылета в формате YYYY-MM-DD',
  })
  @IsDateString()
  date: string;
}

export class PassengersDto {
  @ApiProperty({ example: 1, description: 'Количество взрослых пассажиров' })
  @IsInt()
  adults: number;

  @ApiProperty({ example: 0, description: 'Количество детей' })
  @IsInt()
  children: number;

  @ApiProperty({ example: 0, description: 'Количество младенцев' })
  @IsInt()
  infants: number;
}

export class SearchFlightsDto {
  @ApiProperty({
    description: 'Список направлений (для прямых и обратных рейсов)',
    type: [DirectionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DirectionDto)
  directions: DirectionDto[];

  @ApiProperty({
    description: 'Информация о пассажирах',
    type: PassengersDto,
  })
  @ValidateNested()
  @Type(() => PassengersDto)
  passengers: PassengersDto;

  @ApiProperty({
    enum: TripClass,
    description: 'Класс перелёта',
    example: TripClass.ECONOMY,
  })
  @IsEnum(TripClass)
  trip_class: TripClass;
}
