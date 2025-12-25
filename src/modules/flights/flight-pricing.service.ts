import { Injectable, NotFoundException } from '@nestjs/common';
import { AmadeusService } from './amadeus.service';
import { FlightsSearchStore } from './flights-cache.service';
import { FlightsService } from './flights.service';

@Injectable()
export class FlightsPricingService {
  constructor(
    private readonly searchStore: FlightsSearchStore,
    private readonly amadeus: AmadeusService,
    private readonly flightService: FlightsService,
  ) {}

  async price(searchId: string, offerId: string) {
    console.log('start offer');
    const offer = await this.searchStore.getOffer(searchId, offerId);

    console.log('good offer');
    if (!offer) {
      throw new NotFoundException('Offer not found or expired');
    }

    console.log('offer: ', offer);

    const priced = await this.amadeus.priceFlightOffer(offer);

    const flight = priced.data.flightOffers[0];

    return {
      
    };
  }
}
