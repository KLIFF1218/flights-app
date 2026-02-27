import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Logger } from 'nestjs-pino';

@Injectable()
export class TicketingService {
  constructor(
    @InjectQueue('ticketing')
    private readonly queue: Queue,
    private readonly logger: Logger,
  ) {}

  async issueTicket(bookingId: string) {
    await this.queue.add(
      'issue-ticket',
      { bookingId },
      {
        jobId: `ticket-${bookingId}`,
      },
    );
  }
}
