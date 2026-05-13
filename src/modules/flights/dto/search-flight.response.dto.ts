import type { FlightCardResponse } from '../interfaces/flight-response.dto';

export interface SearchFlightsResponse {
  searchId: string;
  flights: FlightCardResponse[];
}
