import { Module } from '@nestjs/common';
import { AmadeusAuthService } from './amadeus/amadeus-auth.service';
import { AmadeusHttpClient } from './amadeus/amadeus-http-client.service';

@Module({
  providers: [AmadeusAuthService, AmadeusHttpClient],
  exports: [AmadeusHttpClient],
})
export class HttpModule {}
