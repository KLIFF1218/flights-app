import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AirportsService } from './airports.service';
import { CreateAirportDto } from './dto/create-airport.dto';
import { Protected, Roles } from 'src/common/decorators';

@Protected()
@Roles('ADMIN')
@Controller('airports')
export class AirportsController {
  constructor(private readonly airportsService: AirportsService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateAirportDto) {
    return await this.airportsService.create(dto);
  }

  @Get()
  async findAll() {
    return await this.airportsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.airportsService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.airportsService.remove(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAirportDto>,
  ) {
    return await this.airportsService.update(id, dto);
  }
}
