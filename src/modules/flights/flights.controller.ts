import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FlightsService } from './flights.service';
import { CreateFlightDto, SearchFlightsDto } from './dto';
import { Protected } from 'src/common/decorators/protected.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards';
import { Flight } from '@prisma/client';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('flights')
export class FlightsController {
  constructor(private readonly flightService: FlightsService) {}

  @Post('search')
  @ApiOperation({
    summary: 'Поиск доступных рейсов',
    description:
      'Позволяет искать рейсы по направлению, дате, количеству пассажиров и классу обслуживания.',
  })
  @ApiBody({ type: SearchFlightsDto })
  @ApiResponse({
    status: 200,
    description: 'Успешный поиск. Возвращает список найденных рейсов.',
    // type: [],
  })
  @ApiResponse({ status: 404, description: 'Рейсы не найдены' })
  async search(@Body() data: SearchFlightsDto): Promise<Flight[]> {
    return await this.flightService.search(data);
  }

  // @Get(':id')
  // async get(@Param('id') id: string) {
  //   return this.flightsService.findById(id);
  // }

  // //admin only => secure must be

  // @Protected()
  // @Roles('ADMIN')
  // @Post()
  // async create(@Body() dto: CreateFlightDto) {
  //   return await this.flightsService.create(dto);
  // }

  // @Protected()
  // @Roles('ADMIN')
  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   return await this.flightsService.delete(id);
  // }
}
