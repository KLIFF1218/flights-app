import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SeatMapsService } from './seatmap.service';
import { SeatMapDto } from './dto/seatmap.dto';

@Controller('seatmaps')
export class SeatmapsController {
  constructor(private readonly seatmapService: SeatMapsService) {}

  @Get(':flightOrderId')
  async seatmaps(@Param('flightOrderId') flightOrderId: string) {
    return await this.seatmapService.getSeatMap(flightOrderId);
  }

  @Post()
  async getSeatMap(@Body() dto: SeatMapDto) {
    return await this.seatmapService.getSeatMapByOffer(dto);
  }
}
