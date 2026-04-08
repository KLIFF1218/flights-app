import { IsUUID, IsDateString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Currency } from '@prisma/client';

export class CreateFlightInstanceDto {
  @IsUUID()
  flightId: string;

  @IsUUID()
  aircraftId: string;

  @IsDateString()
  departure: string;

  @IsNumber()
  price: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsOptional()
  @IsNumber()
  seatsAvailable?: number;
}
