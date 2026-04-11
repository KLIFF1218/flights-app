import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/infra/db/prisma/prisma.service';
import { Logger } from 'nestjs-pino';

interface AirportLocation {
  id: string;
  name: string;
  city: string | null;
  country: string;
  iataCode: string | null;
}

@Injectable()
export class AirportsService {
  private airportCache: AirportLocation[] | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async searchAirports(keyword: string) {
    if (!keyword || keyword.length < 2) {
      throw new BadRequestException('Keyword must be at least 2 characters');
    }

    const normalizedKeyword = keyword.trim().toLowerCase();
    const airports = await this.loadAirports();

    const results = airports
      .filter((airport) => {
        const name = airport.name.toLowerCase();
        const city = airport.city?.toLowerCase() ?? '';
        const iata = airport.iataCode?.toLowerCase() ?? '';

        return (
          name.includes(normalizedKeyword) ||
          city.includes(normalizedKeyword) ||
          iata.startsWith(normalizedKeyword)
        );
      })
      .slice(0, 10);

    return {
      data: results,
      meta: {
        count: results.length,
      },
    };
  }

  private async loadAirports(): Promise<AirportLocation[]> {
    if (this.airportCache) {
      return this.airportCache;
    }

    try {
      this.airportCache = await this.prisma.airport.findMany({
        select: {
          id: true,
          name: true,
          city: true,
          country: true,
          iataCode: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return this.airportCache;
    } catch (error) {
      this.logger.error('Failed to load airport cache', {
        message: error.message,
      });
      throw error;
    }
  }
}
