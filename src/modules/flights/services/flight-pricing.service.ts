import { Injectable } from '@nestjs/common';
import { AmadeusPricingProvider } from './AmadeusPricingProvider.service';
import { DbPricingProvider } from './DbPricingProvider.service';
import { FlightPricingResponse } from '../dtos/flight-pricing.response.dto';

@Injectable()
export class FlightsPricingService {
  private readonly mode = process.env.BOOKING_MODE === 'REAL' ? 'REAL' : 'MOCK';

  constructor(
    private readonly amadeusProvider: AmadeusPricingProvider,
    private readonly dbProvider: DbPricingProvider,
  ) {}

  async price(searchId: string, offerId: string, options?: any): Promise<FlightPricingResponse> {
    if (this.mode === 'REAL') {
      return this.amadeusProvider.price(searchId, offerId, options);
    }

    return this.dbProvider.price(searchId, offerId, options);
  }
}
