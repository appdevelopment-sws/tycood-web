import { apiClient } from '../lib/apiClient';
import type { Booking } from '../types/bus';

export interface DashboardMetric {
  title: string;
  value: string | number;
  changePercent: number;
  trend: 'up' | 'down';
  description: string;
  iconName: string;
  iconColor: string;
}

export interface DashboardOverviewData {
  metrics: DashboardMetric[];
  recentBookings: Booking[];
}

export const dashboardService = {
  getOverview: async (): Promise<DashboardOverviewData> => {
    return apiClient<DashboardOverviewData>('/dashboard/overview');
  },
};
