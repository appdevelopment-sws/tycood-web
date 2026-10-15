import { apiClient } from '../lib/apiClient';

export interface DashboardMetric {
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

export interface RecentBookingItem {
  id: string;
  bookingNumber: string;
  serviceType: string;
  status: string;
  tripType?: string;
  pickupLocation: string;
  dropLocation?: string;
  scheduledDateTime: string;
  totalAmount: number;
  passengerName: string;
  passengerPhone: string;
  cabName?: string;
  cabPlateNumber?: string;
  driverName?: string;
  paymentStatus?: string;
  createdAt?: string;
}

export interface DashboardOverviewData {
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
  metrics: DashboardMetric[];
  revenueTrend: RevenueDataPoint[];
  serviceDistribution: ServiceDistribution[];
  fleetBreakdown: FleetStatusBreakdown[];
  partnerSummary: PartnerSummary;
  recentBookings: RecentBookingItem[];
}

export const INITIAL_EMPTY_DASHBOARD_DATA: DashboardOverviewData = {
  summary: {
    totalRevenue: 0,
    totalBookings: 0,
    activeRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    totalCabs: 0,
    activeCabs: 0,
    totalDrivers: 0,
    onlineDrivers: 0,
    totalTechnicians: 0,
    availableTechnicians: 0,
    totalParkingFacilities: 0,
    totalUsers: 0,
  },
  metrics: [],
  revenueTrend: [],
  serviceDistribution: [],
  fleetBreakdown: [],
  partnerSummary: {
    drivers: { total: 0, online: 0, verified: 0 },
    technicians: { total: 0, available: 0, verified: 0 },
    parking: { total: 0, verified: 0 },
  },
  recentBookings: [],
};

export const dashboardService = {
  getOverview: async (
    timeRange: 'today' | '7d' | '30d' = '7d'
  ): Promise<DashboardOverviewData> => {
    const params = new URLSearchParams()
    if (timeRange) params.append('timeRange', timeRange)
    const queryString = params.toString() ? `?${params.toString()}` : ''

    const data = await apiClient<DashboardOverviewData>(`/dashboard/overview${queryString}`)
    return data || INITIAL_EMPTY_DASHBOARD_DATA
  },
};
