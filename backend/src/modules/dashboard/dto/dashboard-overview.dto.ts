export interface MetricItem {
  title: string;
  value: string | number;
  changePercent?: number;
  trend?: 'up' | 'down';
  description?: string;
  iconName?: string;
  iconColor?: string;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  bookings: number;
  cabs: number;
  technicians: number;
  parking: number;
}

export interface ServiceDistribution {
  name: string;
  key: string;
  count: number;
  percentage: number;
  color: string;
}

export interface FleetStatusBreakdown {
  category: string;
  count: number;
  available: number;
}

export interface PartnerSummary {
  drivers: {
    total: number;
    online: number;
    verified: number;
  };
  technicians: {
    total: number;
    available: number;
    verified: number;
  };
  parking: {
    total: number;
    verified: number;
  };
}

export interface DashboardOverviewResponse {
  summary: {
    totalRevenue: number;
    totalBookings: number;
    activeRides: number;
    completedRides: number;
    cancelledRides: number;
    totalCabs: number;
    activeCabs: number;
    totalDrivers: number;
    onlineDrivers: number;
    totalTechnicians: number;
    availableTechnicians: number;
    totalParkingFacilities: number;
    totalUsers: number;
  };
  metrics: MetricItem[];
  revenueTrend: RevenueDataPoint[];
  serviceDistribution: ServiceDistribution[];
  fleetBreakdown: FleetStatusBreakdown[];
  partnerSummary: PartnerSummary;
  recentBookings: any[];
}
