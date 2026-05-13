import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAirportDto {
  @ApiProperty({
    example: 'JFK',
    description:
      'Код IATA аэропорта (3 символа, используется в авиаперевозках)',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    example: 'John F. Kennedy International Airport',
    description: 'Полное название аэропорта',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'New York',
    description: 'Город, в котором расположен аэропорт',
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    example: 'United States',
    description: 'Страна расположения аэропорта',
  })
  @IsNotEmpty()
  @IsString()
  country: string;
}
