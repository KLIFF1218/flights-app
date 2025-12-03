import { Injectable } from '@nestjs/common';
import { Flight } from '@prisma/client';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class FlightsCacheService {
  constructor(private readonly redisService: RedisService) {}
  private prefix = 'flights:';

  getKey(origin: string, destination: string, date: string) {
    return `${this.prefix}${origin}-${destination}-${date}`;
  }
  async getCachedFlighs(
    origin: string,
    destination: string,
    date: string,
  ): Promise<Flight[] | null> {
    return await this.redisService.get<Flight[]>(
      this.getKey(origin, destination, date),
    );
  }

  async setCachedFlights(
    origin: string,
    destination: string,
    date: string,
    flights: Flight[],
    ttl?: number,
  ) {
    await this.redisService.set<Flight[]>(
      this.getKey(origin, destination, date),
      flights,
      ttl,
    );
  }
  async clearCacheByPrefix() {
    await this.redisService.delByPrefix(this.prefix);
  }
}
