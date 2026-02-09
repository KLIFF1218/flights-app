import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { SeatMapsService } from './seatmap.service';
import { SeatMapDto } from './dto/seatmap.dto';

@ApiTags('Seat Maps')
@Controller('seatmaps')
export class SeatmapsController {
  constructor(private readonly seatmapService: SeatMapsService) {}

  @Get('by-order/:flightOrderId')
  @ApiOperation({
    summary: 'Получить карту мест по flight order',
    description:
      'Используется после оформления бронирования. Возвращает карту мест по ID flight order.',
  })
  @ApiParam({
    name: 'flightOrderId',
    description: 'Идентификатор flight order',
    example: 'eJzTd9cPCnX2M1...',
  })
  @ApiResponse({
    status: 200,
    description: 'Seat map успешно получен',
  })
  @ApiResponse({
    status: 404,
    description: 'Flight order не найден',
  })
  async getSeatMapByOrder(@Param('flightOrderId') flightOrderId: string) {
    return this.seatmapService.getSeatMap(flightOrderId);
  }

  @Post('by-offer')
  @ApiOperation({
    summary: 'Получить карту мест по flight offer',
    description: 'Используется до бронирования. Позволяет показать клиенту доступные места и цены.',
  })
  @ApiBody({
    type: SeatMapDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Seat map успешно получен',
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные запроса',
  })
  async getSeatMapByOffer(@Body() dto: SeatMapDto) {
    return this.seatmapService.getSeatMapByOffer(dto);
  }
}
