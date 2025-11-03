import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

enum TripClass {
  ECONOMY = 'Y',
  COMFORT = 'W',
  BUSINESS = 'C',
  FIRST = 'F',
}

export class DirectionDto {
  @IsString()
  origin: string;

  @IsString()
  destination: string;

  @IsArray()
  @IsDateString({}, { each: true })
  date: string[];
}

export class PassengersDto {
  @IsInt()
  adulst: number;

  @IsInt()
  children: number;

  @IsInt()
  infants: number;
}

export class SearchFlightsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DirectionDto)
  directions: DirectionDto[];

  @ValidateNested()
  @Type(() => PassengersDto)
  passengers: PassengersDto;

  @IsEnum(TripClass)
  trip_class: TripClass;
}
