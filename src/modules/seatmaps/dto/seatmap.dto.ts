import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SeatMapDto {
  @ApiProperty({
    description: 'Идентификатор поиска (search session id)',
    example: 'search_8f3a2c91',
  })
  @IsString()
  @IsNotEmpty()
  searchId: string;

  @ApiProperty({
    description: 'Идентификатор предложения (offer id)',
    example: 'offer_123456',
  })
  @IsString()
  @IsNotEmpty()
  offerId: string;
}
