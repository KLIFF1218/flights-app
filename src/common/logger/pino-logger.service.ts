import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as pino from 'pino';
import { getTraceId } from '../utils/trace-id';

export interface PinoLoggerOptions {
  level: pino.Level;
  prettyPrint: boolean;
  name?: string;
  [key: string]: any;
}

@Injectable({ scope: Scope.TRANSIENT })
export class PinoLoggerService implements LoggerService {
  private logger: pino.Logger;
  private context?: string;

  constructor(options?: PinoLoggerOptions) {
    const defaultOptions: pino.LoggerOptions = {
      level: options?.level,
      name: options?.name,
      timestamp: pino.stdTimeFunctions.isoTime,
      mixin() {
        const traceId = getTraceId();
        return traceId ? { traceId } : {};
      },
    };

    if (options?.prettyPrint) {
      defaultOptions.transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      };
    }

    this.logger = pino.default(defaultOptions);
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, ...optionalParams: any[]) {
    this.callPinoMethod('info', message, optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.callPinoMethod('error', message, optionalParams);
  }
  warn(message: any, ...optionalParams: any[]) {
    this.callPinoMethod('warn', message, optionalParams);
  }
  debug(message: any, ...optionalParams: any[]) {
    this.callPinoMethod('debug', message, optionalParams);
  }
  verbose(message: any, ...optionalParams: any[]) {
    this.callPinoMethod('trace', message, optionalParams);
  }

  private callPinoMethod(
    level: pino.Level,
    message: any,
    optionalParams: any[],
  ) {
    let context = this.context;
    let data: Record<string, any> = {};
    let stack: string | undefined;
    if (optionalParams.length > 0) {
      if (typeof optionalParams[optionalParams.length - 1] === 'string') {
        context = optionalParams.pop();
      }
      if (optionalParams.length > 0) {
        if (
          typeof optionalParams[optionalParams.length - 1] === 'object' &&
          optionalParams[optionalParams.length - 1] !== null
        ) {
          data = optionalParams.pop();
        }
        if (
          optionalParams.length === 1 &&
          typeof optionalParams[0] === 'string'
        ) {
          stack = optionalParams.pop();
        }
      }
    }
    const logObject: Record<string, any> = { ...data };
    if (context) logObject.context = context;
    if (stack) logObject.stack = stack;
    if (typeof message === 'object' && message !== null) {
      this.logger[level]({ ...logObject, ...message });
    } else {
      this.logger[level](logObject, message);
    }
  }
}
