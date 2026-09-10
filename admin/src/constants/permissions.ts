/**
 * Permission Keys and Granular Action Definitions matching Backend RBAC
 */

export const RESOURCES = {
  DASHBOARD: 'dashboard',
  OPERATORS: 'operators',
  BUSES: 'buses',
  ROUTES: 'routes',
  STATIONS: 'stations',
  SCHEDULES: 'schedules',
  TRIPS: 'trips',
  BOOKINGS: 'bookings',
  USERS: 'users',
  DRIVERS: 'drivers',
  SEATS: 'seats',
  ANALYTICS: 'analytics',
  ROLES: 'roles',
  SETTINGS: 'settings',
} as const;

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
} as const;

export type Resource = typeof RESOURCES[keyof typeof RESOURCES];
export type Action = typeof ACTIONS[keyof typeof ACTIONS];

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_READ: 'dashboard:read',

  // Operators
  OPERATORS_READ: 'operators:read',
  OPERATORS_CREATE: 'operators:create',
  OPERATORS_UPDATE: 'operators:update',
  OPERATORS_DELETE: 'operators:delete',

  // Buses
  BUSES_READ: 'buses:read',
  BUSES_CREATE: 'buses:create',
  BUSES_UPDATE: 'buses:update',
  BUSES_DELETE: 'buses:delete',

  // Routes & Stations
  ROUTES_READ: 'routes:read',
  ROUTES_CREATE: 'routes:create',
  ROUTES_UPDATE: 'routes:update',
  ROUTES_DELETE: 'routes:delete',

  STATIONS_READ: 'stations:read',
  STATIONS_CREATE: 'stations:create',
  STATIONS_UPDATE: 'stations:update',

  // Schedules & Trips
  SCHEDULES_READ: 'schedules:read',
  SCHEDULES_CREATE: 'schedules:create',
  SCHEDULES_UPDATE: 'schedules:update',

  TRIPS_READ: 'trips:read',
  TRIPS_CREATE: 'trips:create',
  TRIPS_UPDATE: 'trips:update',

  // Bookings
  BOOKINGS_READ: 'bookings:read',
  BOOKINGS_CREATE: 'bookings:create',
  BOOKINGS_CANCEL: 'bookings:delete',

  // Users & Drivers
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
  DRIVERS_READ: 'drivers:read',
  DRIVERS_MANAGE: 'drivers:manage',

  // Seats
  SEATS_READ: 'seats:read',
  SEATS_MANAGE: 'seats:manage',

  // Analytics & Admin
  ANALYTICS_READ: 'analytics:read',
  ROLES_MANAGE: 'roles:manage',
  SETTINGS_MANAGE: 'settings:manage',
} as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'], // Has access to everything
  BUS_OPERATOR: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.BUSES_READ,
    PERMISSIONS.BUSES_CREATE,
    PERMISSIONS.BUSES_UPDATE,
    PERMISSIONS.DRIVERS_READ,
    PERMISSIONS.DRIVERS_MANAGE,
    PERMISSIONS.ROUTES_READ,
    PERMISSIONS.SCHEDULES_READ,
    PERMISSIONS.SCHEDULES_CREATE,
    PERMISSIONS.TRIPS_READ,
    PERMISSIONS.TRIPS_CREATE,
    PERMISSIONS.BOOKINGS_READ,
    PERMISSIONS.SEATS_READ,
    PERMISSIONS.SEATS_MANAGE,
    PERMISSIONS.ANALYTICS_READ,
  ],
  DISPATCHER: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.BUSES_READ,
    PERMISSIONS.DRIVERS_READ,
    PERMISSIONS.ROUTES_READ,
    PERMISSIONS.STATIONS_READ,
    PERMISSIONS.SCHEDULES_READ,
    PERMISSIONS.TRIPS_READ,
    PERMISSIONS.TRIPS_UPDATE,
    PERMISSIONS.BOOKINGS_READ,
  ],
  FINANCE_ADMIN: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.BOOKINGS_READ,
    PERMISSIONS.OPERATORS_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],
  SUPPORT_AGENT: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.BOOKINGS_READ,
    PERMISSIONS.BOOKINGS_CANCEL,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.TRIPS_READ,
  ],
};
