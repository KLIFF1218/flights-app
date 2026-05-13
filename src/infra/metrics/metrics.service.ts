import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  readonly flightSearchCounter = new Counter({
    name: 'flights_app_search_total',
    help: 'Total number of flight searches',
    labelNames: ['origin', 'destination', 'status'],
  });

  readonly flightSearchDuration = new Histogram({
    name: 'flights_app_search_duration_seconds',
    help: 'Flight search duration in seconds',
    labelNames: ['origin', 'status'],
    buckets: [0.5, 1, 2, 5, 10],
  });

  readonly bookingCounter = new Counter({
    name: 'flights_app_bookings_total',
    help: 'Total number of bookings',
    labelNames: ['status'],
  });

  readonly paymentCounter = new Counter({
    name: 'flights_app_payments_total',
    help: 'Total number of payments',
    labelNames: ['provider', 'status'],
  });
}