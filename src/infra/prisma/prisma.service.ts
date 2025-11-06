import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private logger = new Logger(PrismaService.name);
  async onModuleInit() {
    this.logger.log('Initializing DB connection...');
    try {
      await this.$connect();

      this.logger.log('✅Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to the DB: ', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing DB connection...');
    try {
      await this.$disconnect();

      this.logger.log('Closed database connection successfully');
    } catch (error) {
      this.logger.error('❌ Failed to close the database connection: ', error);
      throw error;
    }
  }
}
