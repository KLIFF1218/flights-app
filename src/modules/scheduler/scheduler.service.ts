import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/infra/db/prisma/prisma.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredSeatHolds() {
    const now = new Date();

    const deleted = await this.prisma.seatHold.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    if (deleted.count > 0) {
      this.logger.log(`Cleaned ${deleted.count} expired seat holds`);
    }
  }
}
