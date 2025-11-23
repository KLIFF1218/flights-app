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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AirportResponseDto } from './dto/aiport-response.dto';

@ApiTags('Airports')
@ApiBearerAuth()
@Protected()
@Roles('ADMIN', 'USER')
@Controller('airports')
export class AirportsController {
  constructor(private readonly airportsService: AirportsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Создать новый аэропорт',
  })
  @ApiBody({
    type: CreateAirportDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Аэропорт успешно создан',
    type: AirportResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка валидации входных данных',
  })
  async create(@Body() dto: CreateAirportDto) {
    return await this.airportsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список всех аэропортов' })
  @ApiResponse({
    status: 200,
    description: 'Список аэропортов успешно получен',
    type: [AirportResponseDto],
  })
  async findAll() {
    return await this.airportsService.findAll();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'UUID аэропорта',
    example: '3b0a3ef2-34fd-49da-98b4-dc5481b47a3a',
  })
  @ApiResponse({
    status: 200,
    description: 'Аэропорт найден',
    type: AirportResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Аэропорт не найден',
  })
  @ApiOperation({ summary: 'Получить аэропорт по ID' })
  async findOne(@Param('id') id: string) {
    return await this.airportsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить аэропорт по ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID аэропорта',
    example: '3b0a3ef2-34fd-49da-98b4-dc5481b47a3a',
  })
  @ApiResponse({
    status: 200,
    description: 'Аэропорт успешно удалён',
    type: AirportResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Аэропорт не найден',
  })
  async remove(@Param('id') id: string) {
    return await this.airportsService.remove(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные аэропорта' })
  @ApiParam({
    name: 'id',
    description: 'UUID аэропорта',
    example: '3b0a3ef2-34fd-49da-98b4-dc5481b47a3a',
  })
  @ApiBody({
    type: CreateAirportDto,
    description: 'Поля для обновления аэропорта (частично)',
  })
  @ApiResponse({
    status: 200,
    description: 'Аэропорт успешно обновлён',
    type: AirportResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Аэропорт не найден',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAirportDto>,
  ) {
    return await this.airportsService.update(id, dto);
  }
}
