import { useAuth } from './useAuth';

export const usePermission = () => {
  const { hasPermission, hasRole, user } = useAuth();

  return {
    user,
    hasPermission,
    hasRole,
    canManageOperators: hasPermission('operators', 'manage') || hasPermission('operators', 'create'),
    canManageBuses: hasPermission('buses', 'manage') || hasPermission('buses', 'create'),
    canManageRoutes: hasPermission('routes', 'manage') || hasPermission('routes', 'create'),
    canManageTrips: hasPermission('trips', 'manage') || hasPermission('trips', 'create'),
    canManageBookings: hasPermission('bookings', 'manage') || hasPermission('bookings', 'create'),
    canCancelBooking: hasPermission('bookings', 'delete'),
    canManageRoles: hasPermission('roles', 'manage'),
  };
};
