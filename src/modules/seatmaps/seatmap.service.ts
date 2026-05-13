import { Injectable, BadRequestException } from '@nestjs/common';
import { AmadeusService } from '../flights/amadeus.service';
import { SeatMap } from './types/seatmap.type';

type AmadeusSeatMapResponse = {
  data: any[];
  dictionaries: {
    facilities: Record<string, string>;
    seatCharacteristics: Record<string, string>;
  };
};

type EmptyCell = {
  type: 'EMPTY';
};

type FacilityCell = {
  type: 'FACILITY';
  code: string;
  label?: string;
};

type SeatCell = {
  type: 'SEAT';
  seatNumber: string;
  status: string;
  price: number | null;
  characteristics: string[];
};

type GridCell = EmptyCell | FacilityCell | SeatCell;

@Injectable()
export class SeatMapsService {
  constructor(private readonly amadeusService: AmadeusService) {}

  async getSeatMap(flightOrderId: string) {
    const response = await this.amadeusService.getSeatMaps(flightOrderId);

    if (!response.data?.length) {
      throw new BadRequestException('Seat map not available');
    }

    return response.data.map((seatmap) =>
      this.buildSeatMapUI(seatmap, response.dictionaries),
    );
  }

  private buildSeatMapUI(
    seatmap: SeatMap,
    dictionaries: AmadeusSeatMapResponse['dictionaries'],
  ) {
    const deck = seatmap.decks?.[0];
    if (!deck) return null;

    const { width, length } = deck.deckConfiguration;

    const grid: GridCell[][] = Array.from({ length }, () =>
      Array.from({ length: width }, () => ({ type: 'EMPTY' })),
    );

    for (const facility of deck.facilities ?? []) {
      const { x, y } = facility.coordinates;
      if (!grid[x]?.[y]) continue;

      grid[x][y] = {
        type: 'FACILITY',
        code: facility.code,
        label: dictionaries.facilities?.[facility.code],
      };
    }

    for (const seat of deck.seats ?? []) {
      const { x, y } = seat.coordinates;
      if (!grid[x]?.[y]) continue;

      const pricing = seat.travelerPricing?.[0];

      grid[x][y] = {
        type: 'SEAT',
        seatNumber: seat.number,
        status: pricing?.seatAvailabilityStatus ?? 'UNKNOWN',
        price: pricing?.price?.total ? Number(pricing.price.total) : null,
        characteristics:
          seat.characteristicsCodes?.map(
            (c) => dictionaries.seatCharacteristics?.[c],
          ) ?? [],
      };
    }

    return {
      segmentId: seatmap.segmentId,
      aircraft: seatmap.aircraft.code,
      cabin: seatmap.class,
      grid,
      legend: {
        facilities: dictionaries.facilities,
        seatCharacteristics: dictionaries.seatCharacteristics,
      },
    };
  }
}
