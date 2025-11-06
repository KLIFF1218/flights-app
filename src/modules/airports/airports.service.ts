import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateAirportDto } from './dto/create-airport.dto';

@Injectable()
export class AirportsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateAirportDto) {
    const { code, name, city, country } = dto;
    return await this.prismaService.airport.create({
      data: {
        code,
        name,
        city,
        country,
      },
    });
  }

  async remove(airportId: string) {
    return await this.prismaService.airport.delete({
      where: {
        id: airportId,
      },
    });
  }

  async findOne(airportId: string) {
    return await this.prismaService.airport.findUnique({
      where: {
        id: airportId,
      },
    });
  }

  async findAll() {
    return await this.prismaService.airport.findMany();
  }

  async update(airportId: string, dto: Partial<CreateAirportDto>) {
    return await this.prismaService.airport.update({
      where: {
        id: airportId,
      },
      data: {
        ...dto,
      },
    });
  }
}
