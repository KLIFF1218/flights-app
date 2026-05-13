import { IsEnum, IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentProvider } from '@prisma/client';
import type { FlightOrderData } from './flight-order-booking-response.type';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  flightOrder: FlightOrderData;

  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;
}
