import { Body, Controller, Post } from '@nestjs/common';
import { FlightsPricingService } from './flight-pricing.service';
import { FlightPricingRequestDto } from './dto/flight-pricing.request.dto';

@Controller('flight/pricing')
export class FlightPricingController {
  constructor(private readonly pricingService: FlightsPricingService) {}
  @Post()
  async price(@Body() dto: FlightPricingRequestDto) {
    console.log('start');
    return await this.pricingService.price(dto.searchId, dto.offerId);
  }
}
