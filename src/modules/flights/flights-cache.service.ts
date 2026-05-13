import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { FlightOffer } from './types/flight-offers.type';

const DEFAULT_TTL_SECONDS = 15 * 60;

@Injectable()
export class FlightsSearchStore {
  private readonly prefix = 'flights:search';

  constructor(private readonly redisService: RedisService) {}

  private buildKey(searchId: string): string {
    return `${this.prefix}:${searchId}`;
  }

  async saveSearchResults(
    searchId: string,
    offers: FlightOffer[],
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    await this.redisService.set(this.buildKey(searchId), offers, ttlSeconds);
  }

  async getOffer(
    searchId: string,
    offerId: string,
  ): Promise<FlightOffer | null> {
    const offers = await this.redisService.get<FlightOffer[]>(
      this.buildKey(searchId),
    );

    if (!offers) {
      return null;
    }

    return offers.find((offer) => offer.id === offerId) ?? null;
  }

  async clearSearch(searchId: string): Promise<void> {
    await this.redisService.delete(this.buildKey(searchId));
  }
}
