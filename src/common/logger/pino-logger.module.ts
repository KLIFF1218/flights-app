import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { PinoLoggerService, PinoLoggerOptions } from './pino-logger.service';

@Global()
@Module({})
export class PinoLoggerModule {
  static forRoot(options: PinoLoggerOptions): DynamicModule {
    const pinoLoggerProvider: Provider = {
      provide: PinoLoggerService,
      useFactory: () => new PinoLoggerService(options),
      scope: options.scope || undefined,
    };

    return {
      module: PinoLoggerModule,
      providers: [pinoLoggerProvider],
      exports: [PinoLoggerService],
    };
  }
}
