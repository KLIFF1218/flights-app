import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';
import { Currency, PaymentProvider } from '@prisma/client';

export class CreateBookingDto {
  @ApiProperty({
    example: 'clu3y58a1000kz0q2j6xw8yz2',
    description: 'ID пользователя',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'BUSINESS', description: 'Класс перелёта' })
  @IsNotEmpty()
  @IsString()
  tripClass: string;

  @ApiProperty({ example: 'John', description: 'Имя пассажира' })
  @IsNotEmpty()
  @IsString()
  passengerName: string;

  @ApiProperty({ example: 'Doe', description: 'Фамилия пассажира' })
  @IsNotEmpty()
  @IsString()
  passengerLastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email пассажира',
  })
  @IsNotEmpty()
  @IsEmail()
  passengerEmail: string;

  @ApiProperty({ example: 2, description: 'Количество мест для бронирования' })
  @IsInt()
  @Min(1)
  seats: number;

  @ApiProperty({
    example: 'clu3y88a5000xz0q2r8ye7u12',
    description: 'ID рейса',
  })
  @IsNotEmpty()
  @IsString()
  flightId: string;

  @ApiProperty({
    example: 'USD',
    enum: Currency,
    description: 'Валюта транзакции',
  })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({
    example: 'STRIPE',
    enum: PaymentProvider,
    description: 'Платёжный провайдер',
  })
  @IsEnum(PaymentProvider)
  paymentMethod: PaymentProvider;
}
