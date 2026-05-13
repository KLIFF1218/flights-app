export interface FlightPricingResponse {
  id: string;

  price: {
    total: number;
    currency: string;
  };

  outbound: FlightDirection;
  inbound?: FlightDirection;
}

interface FlightDirection {
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  segments: FlightSegment[];
}

interface FlightSegment {
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
}
