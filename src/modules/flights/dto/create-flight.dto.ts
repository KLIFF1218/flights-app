import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsDateString,
  IsDecimal,
} from 'class-validator';

export class CreateFlightDto {
  @IsNotEmpty()
  @IsString()
  flightNumber: string;

  @IsNotEmpty()
  @IsString()
  departureAirportId: string;

  @IsNotEmpty()
  @IsString()
  arrivalAirportId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @IsNotEmpty()
  @IsNumber()
  availableSeats: number;

  @IsNotEmpty()
  departureTime: string;

  @IsNotEmpty()
  arrivalTime: string;

  @IsNotEmpty()
  @IsString()
  airline: string;
}
