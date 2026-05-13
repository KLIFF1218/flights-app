import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/infra/db/prisma/prisma.service';
import { PdfService } from 'src/infra/pdf/pdf.service';
import { S3Service } from 'src/infra/storage/s3.service';
import { MailService } from 'src/infra/mail/mail.service';
import { BookingStatus } from '@prisma/client';
@Processor('ticketing')
export class TicketingProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly s3: S3Service,
    private readonly mailService: MailService,
  ) {
    super();
  }

  async process(job: Job<{ bookingId: string }>) {
    console.log('start to process ticket');

    const { bookingId } = job.data;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        travelers: true,
        tickets: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const snapshot = booking.snapshot as any;

    const flightOffer = snapshot.flightOffers[0];

    const itinerary = flightOffer.itineraries[0];
    const segments = itinerary.segments;

    const generatedTickets: {
      travelerId: string;
      ticketNumber: string;
      downloadUrl: string;
    }[] = [];

    for (const traveler of booking.travelers) {

      const existingTicket = await this.prisma.ticket.findUnique({
        where: {
          travelerId: traveler.id,
        },
      });

      if (existingTicket) {
        continue;
      }

      const passengerName = `${traveler.firstName} ${traveler.lastName}`.toUpperCase();

      const firstSegment = segments[0];

      const pdfBuffer = await this.pdfService.generateTicket({
        pnr: booking.pnrLocator,
        passengerName,
        origin: firstSegment.departure.iataCode,
        destination: firstSegment.arrival.iataCode,
        flightNumber: `${firstSegment.carrierCode}-${firstSegment.number}`,
        date: new Date(firstSegment.departure.at).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        departureTime: new Date(firstSegment.departure.at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

      const fileKey = `tickets/${bookingId}/${traveler.id}.pdf`;

      await this.s3.uploadFile({
        key: fileKey,
        body: pdfBuffer,
        contentType: 'application/pdf',
      });

      const ticketNumber = `SC-${Date.now()}-${traveler.id.slice(-6)}`;

      const ticket = await this.prisma.ticket.create({
        data: {
          bookingId,
          travelerId: traveler.id,
          ticketNumber,
          pdfKey: fileKey,
        },
      });

      const downloadUrl = await this.s3.getDownloadUrl(fileKey);

      generatedTickets.push({
        travelerId: traveler.id,
        ticketNumber: ticket.ticketNumber,
        downloadUrl,
      });
    }

    await this.prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: BookingStatus.TICKETED,
      },
    });

    if (booking.user.email) {
      await this.mailService.sendBookingSuccess(
        {
          ...booking.user,
          email: booking.user.email,
        },
        bookingId,
        generatedTickets,
      );
    }
  }
}
