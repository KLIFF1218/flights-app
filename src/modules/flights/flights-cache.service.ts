import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class FlightsSearchStore {
  constructor(private readonly redisService: RedisService) {}

  private prefix = 'flights:search:';

  private getKey(searchId: string) {
    return `${this.prefix}${searchId}`;
  }

  async saveSearchResults(
    searchId: string,
    flightOffers: any[],
    ttlSeconds = 90000,
  ) {
    await this.redisService.set(
      this.getKey(searchId),
      flightOffers,
      ttlSeconds,
    );
  }

  async getOffer(searchId: string, offerId: string) {
    const offers = await this.redisService.get<any[]>(this.getKey(searchId));
    if (!offers) return null;

    return offers.find((o) => o.id === offerId);
  }

  async clearSearch(searchId: string) {
    await this.redisService.delete(this.getKey(searchId));
  }
}
