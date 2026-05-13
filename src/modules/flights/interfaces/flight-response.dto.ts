export interface FlightSegmentDto {
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  cabin: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
}

export interface FlightDirectionDto {
  departure: {
    airport: string;
    time: string;
  };
  arrival: {
    airport: string;
    time: string;
  };
  durationMinutes: number;
  stops: number;
  segments: FlightSegmentDto[];
}

export interface FlightCardResponse {
  id: string;

  price: {
    total: number;
    currency: string;
  };

  route: {
    from: string;
    to: string;
    roundTrip: boolean;
  };

  outbound: FlightDirectionDto;
  inbound?: FlightDirectionDto;

  baggage: {
    checked: number;
  };

  airlines: string[];
}
