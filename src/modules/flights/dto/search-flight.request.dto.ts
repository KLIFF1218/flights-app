import { IsArray, IsEnum, IsOptional, IsString, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum TravelClass {
  ECONOMY = 'ECONOMY',
  PREMIUM_ECONOMY = 'PREMIUM_ECONOMY',
  BUSINESS = 'BUSINESS',
  FIRST = 'FIRST',
}

export enum SortBy {
  PRICE = 'price',
  DURATION = 'duration',
  OPTIMAL = 'optimal',
}

export class DirectionDto {
  @IsString()
  origin: string;

  @IsString()
  destination: string;

  @IsString()
  date: string;
}

export class PassengersDto {
  @IsInt()
  @Min(1)
  adults: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  children?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  infants?: number;
}

export class SearchFlightsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DirectionDto)
  directions: DirectionDto[];

  @ValidateNested()
  @Type(() => PassengersDto)
  passengers: PassengersDto;

  @IsEnum(TravelClass)
  travelClass: TravelClass;

  @IsOptional()
  @IsEnum(SortBy)
  sort?: SortBy;
}
