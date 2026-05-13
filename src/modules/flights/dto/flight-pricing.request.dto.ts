import { IsString } from 'class-validator';

export class FlightPricingRequestDto {
  @IsString()
  searchId: string;

  @IsString()
  offerId: string;
}
