import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingResponse } from './dto/booking-response';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: jest.Mocked<BookingsService>;

  const mockBookingsService = {
    create: jest.fn(),
    findByAllUser: jest.fn(),
    cancelBooking: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('должен вызывать service.create(dto) и возвращать результат', async () => {
      const dto: CreateBookingDto = {
        flightId: 'flight_123',
        seats: 2,
        passengerEmail: 'a@b.com',
        passengerLastName: 'Doe',
        passengerName: 'John',
        userId: 'user_1',
        tripClass: 'ECONOMY',
        paymentMethod: 'YOOKASSA',
        currency: 'RUB',
      };

      const mockResult = {
        booking: {
          id: 'booking_123',
          status: 'PENDING',
          seats: 2,
          passengerName: 'John',
          passengerLastName: 'Doe',
          passengerEmail: 'a@b.com',
          flightId: 'flight_123',
          userId: 'user_1',
          tripClass: 'ECONOMY',
          bookingNumber: 'BK-2025-12345678',
          createdAt: new Date(),
        },
        payment_link: 'https://pay.test/link/abc',
      };

      mockBookingsService.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto);

      expect(mockBookingsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUserBookings', () => {
    it('должен вернуть список бронирований пользователя', async () => {
      const userId = 'user_1';

      const mockBookings: BookingResponse[] = [
        {
          id: 'b1',
          status: 'PENDING',
          seats: 1,
          passengerName: 'A',
          passengerLastName: 'B',
          passengerEmail: 'a@b.com',
          bookingNumber: 'DDFG85',
          updatedAt: new Date(),
          tripClass: 'ECONOMY',
          createdAt: new Date(),
        },
        {
          id: 'b2',
          status: 'CONFIRMED',
          seats: 2,
          passengerName: 'C',
          passengerLastName: 'D',
          passengerEmail: 'c@d.com',
          bookingNumber: 'DG55GRG',
          updatedAt: new Date(),
          tripClass: 'BUSINESS',
          createdAt: new Date(),
        },
      ];

      mockBookingsService.findByAllUser.mockResolvedValue(mockBookings);

      const result = await controller.getUserBookings(userId);

      expect(mockBookingsService.findByAllUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockBookings);
    });
  });

  describe('cancel', () => {
    it('должен вызвать cancelBooking и вернуть обновлённое бронирование', async () => {
      const bookingId = 'booking_123';

      const mockBooking = {
        id: bookingId,
        status: 'CANCELED',
        seats: 1,
        passengerName: 'John',
        passengerLastName: 'Doe',
        passengerEmail: 'a@b.com',
        tripClass: 'ECONOMY',
        updatedAt: new Date(),
        bookingNumber: 'DSGAS3354',
        createdAt: new Date(),
      };

      service.cancelBooking.mockResolvedValue(mockBooking);

      const result = await controller.cancel(bookingId);

      expect(mockBookingsService.cancelBooking).toHaveBeenCalledWith(bookingId);
      expect(result).toEqual(mockBooking);
    });
  });
});
