import { useQuery } from '@tanstack/react-query';
import { dashboardService, INITIAL_EMPTY_DASHBOARD_DATA } from '../services/dashboardService';
import { queryKeys } from '../lib/queryKeys';

export function useDashboard(timeRange: 'today' | '7d' | '30d' = '7d') {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.dashboard.overview(timeRange),
    queryFn: () => dashboardService.getOverview(timeRange),
    staleTime: 5000,
  });

  const dashboardData = data || INITIAL_EMPTY_DASHBOARD_DATA;

  return {
    data: dashboardData,
    summary: dashboardData.summary,
    metrics: dashboardData.metrics,
    revenueTrend: dashboardData.revenueTrend,
    serviceDistribution: dashboardData.serviceDistribution,
    fleetBreakdown: dashboardData.fleetBreakdown,
    partnerSummary: dashboardData.partnerSummary,
    recentBookings: dashboardData.recentBookings,
    isLoading: isLoading || isFetching,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
