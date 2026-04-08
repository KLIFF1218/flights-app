export class MonthlyRevenueDto {
  month: string;
  revenue: number;
}

export class BookingStatusDto {
  name: string;
  value: number;
}

export class TopRouteDto {
  route: string;
  bookings: number;
}

export class DashboardStatsDto {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;

  usersGrowth: number;
  bookingsGrowth: number;
  revenueGrowth: number;

  activeFlights: number;
  activeFlightsDelta: number;

  monthlyRevenue: MonthlyRevenueDto[];
  bookingsByStatus: BookingStatusDto[];
  topRoutes: TopRouteDto[];
}
