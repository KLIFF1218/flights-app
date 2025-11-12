import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateFlightDto, SearchFlightsDto } from './dto';
import { FlightsCacheService } from './flights-cache.service';

@Injectable()
export class FlightsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly flightsCacheService: FlightsCacheService,
  ) {}
  // async create(dto: CreateFlightDto) {
  //   return await this.prismaService.flight.create({
  //     data: {
  //       price: dto.price,
  //       airline: dto.airline,
  //       arrivalTime: new Date(dto.arrivalTime),
  //       availableSeats: dto.availableSeats,
  //       departureTime: new Date(dto.departureTime),
  //       flightNumber: dto.flightNumber,
  //       departureAirportId: dto.departureAirportId,
  //       arrivalAirportId: dto.arrivalAirportId,
  //     },
  //   });
  // }

  // async update(id: string, dto: Partial<CreateFlightDto>) {
  //   const exist = await this.prismaService.flight.findUnique({
  //     where: {
  //       id,
  //     },
  //   });

  //   if (!exist) throw new NotFoundException('Рейс не найден');
  //   return await this.prismaService.flight.update({
  //     where: {
  //       id,
  //     },
  //     data: {
  //       ...(dto.departureTime
  //         ? { departureTime: new Date(dto.departureTime) }
  //         : {}),
  //       ...(dto.arrivalTime ? { arrivalTime: new Date(dto.arrivalTime) } : {}),
  //       ...('price' in dto ? { price: dto.price } : {}),
  //       ...('availableSeats' in dto
  //         ? { availableSeats: dto.availableSeats }
  //         : {}),
  //       ...(dto.flightNumber ? { flightNumber: dto.flightNumber } : {}),
  //     },
  //   });
  // }

  // async findById(id: string) {
  //   return await this.prismaService.flight.findUnique({
  //     where: {
  //       id,
  //     },
  //     include: {
  //       departureAirport: true,
  //       arrivalAirport: true,
  //     },
  //   });
  // }

  // async delete(id: string) {
  //   return await this.prismaService.flight.delete({
  //     where: { id },
  //   });
  // }

  async search(data: SearchFlightsDto) {
    const { directions, passengers, trip_class } = data;
    const { date, destination, origin } = data.directions[0];

    const cached = await this.flightsCacheService.getCachedFlighs(
      origin,
      destination,
      date,
    );

    if (cached) return cached;

    const departureDateStart = new Date(directions[0].date);
    // departureDateStart.setUTCHours(0, 0, 0, 0);
    const departureDateEnd = new Date(departureDateStart);
    departureDateEnd.setUTCDate(departureDateEnd.getDate() + 1);

    const arrivalDateStart = new Date(directions[directions.length - 1].date);
    const arrivalDateEnd = new Date(arrivalDateStart);
    arrivalDateEnd.setUTCDate(arrivalDateEnd.getDate() + 1);

    const flights = await this.prismaService.flight.findMany({
      where: {
        origin: directions[0].origin,
        destination: directions[0].destination,
        departureDate: { gte: departureDateStart, lt: departureDateEnd },
        // arrivalDate: { gte: arrivalDateStart, lt: arrivalDateEnd },
      },
      orderBy: {
        departureDate: 'asc',
      },
    });

    await this.flightsCacheService.setCachedFlights(
      origin,
      destination,
      date,
      flights,
    );

    return flights;
  }
}
