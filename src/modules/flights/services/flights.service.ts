import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { SearchFlightsDto } from '../dtos/index';
import { SearchFlightsResponse } from '../dtos/search-flight.response.dto';
import { FlightCardResponse } from '../interfaces/flight-response.dto';

import { AmadeusService } from '../services/amadeus.service';
import { FlightsSearchStore } from '../services/flights-cache.service';
import { MetricsService } from '../../../infra/metrics/metrics.service';

import { FlightOffer, Itinerary } from '../interfaces/flight-offers.interface';

@Injectable()
export class FlightsService {
  constructor(
    private readonly amadeus: AmadeusService,
    private readonly searchStore: FlightsSearchStore,
    private readonly metrics: MetricsService,
  ) {}

  async search(data: SearchFlightsDto): Promise<SearchFlightsResponse> {
    const timer = this.metrics.flightSearchDuration.startTimer();
    const originAirport = data.directions[0].origin;
    const destinationAirport = data.directions[0].destination;

    try {
      const response = await this.amadeus.searchFlights({
        directions: data.directions,
        passengers: data.passengers,
        travelClass: data.travelClass,
      });

      const searchId = randomUUID();

      const rawOffers: FlightOffer[] = response?.data ?? [];
      await this.searchStore.saveSearchResults(searchId, rawOffers);

      const flights = rawOffers.map((offer) => this.mapOfferToCard(offer));

      this.metrics.flightSearchCounter.inc({
        origin: originAirport,
        destination: destinationAirport,
        status: 'success',
      });

      timer({ origin: originAirport, status: 'success' });

      return {
        searchId,
        flights,
      };
    } catch (error) {
      this.metrics.flightSearchCounter.inc({
        origin: originAirport,
        destination: destinationAirport,
        status: 'error',
      });

      timer({ origin: originAirport, status: 'error' });

      throw error;
    }
  }

  private mapOfferToCard(offer: FlightOffer): FlightCardResponse {
    const routes = offer.itineraries.map((itinerary) => {
      const segments = this.mapSegments(itinerary);

      const routeDurationMinutes = this.parseDuration(itinerary.duration);
      return {
        availableSeats: offer.numberOfBookableSeats,
        from: segments[0].from,
        to: segments[segments.length - 1].to,

        departure: {
          airport: segments[0].from,
          time: segments[0].departureTime,
          date: segments[0].departureTime,
        },

        arrival: {
          airport: segments[segments.length - 1].to,
          time: segments[segments.length - 1].arrivalTime,
          date: segments[segments.length - 1].arrivalTime,
        },

        durationMinutes: routeDurationMinutes,
        stops: segments.length - 1,
        stopCodes: segments.map((s) => s.to).slice(0, -1),

        airline: segments[0].airline,
        segments,
      };
    });

    return {
      offerId: offer.id,
      price: {
        total: Number(offer.price.total),
        currency: offer.price.currency,
      },
      routes,
      totalDurationMinutes: routes.reduce((sum, r) => sum + r.durationMinutes, 0),
    };
  }

  private mapSegments(itinerary: Itinerary) {
    return itinerary.segments.map((segment) => ({
      segmentId: segment.number,

      from: segment.departure.iataCode,
      to: segment.arrival.iataCode,

      departureTime: segment.departure.at,
      arrivalTime: segment.arrival.at,

      airline: segment.carrierCode,
      flightNumber: segment.number,
      durationMinutes: this.parseDuration(segment.duration),
    }));
  }

  private parseDuration(duration?: string): number {
    if (!duration) return 0;

    const hours = Number(duration.match(/(\d+)H/)?.[1] ?? 0);
    const minutes = Number(duration.match(/(\d+)M/)?.[1] ?? 0);

    return hours * 60 + minutes;
  }
}

