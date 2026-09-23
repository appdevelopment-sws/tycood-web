/**
 * Application Routes & Navigation Setup
 */

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/",
  OPERATORS: "/operators",
  CABS_TYPE: "/cabs-type",
  ROUTES: "/routes",
  STATIONS: "/stations",
  SCHEDULES: "/schedules",
  TRIPS: "/trips",
  BOOKINGS: "/bookings",
  USERS: "/users",
  VOUCHERS: "/vouchers",
  DRIVERS: "/drivers",
  SEATS: "/seats",
  REPORTS: "/reports",
  ROLES: "/roles",
  SETTINGS: "/settings",
} as const

export interface NavItem {
  id: string
  title: string
  path: string
  iconName: string
  badge?: string
  resourcePermission?: string
}

export interface NavSection {
  sectionTitle: string
  items: NavItem[]
}

export const SIDEBAR_NAVIGATION: NavSection[] = [
  {
    sectionTitle: "Overview",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        path: ROUTES.DASHBOARD,
        iconName: "LayoutDashboard",
        resourcePermission: "dashboard:read",
      },
      // {
      //   id: 'reports',
      //   title: 'Analytics & Revenue',
      //   path: ROUTES.REPORTS,
      //   iconName: 'BarChart3',
      //   badge: 'Live',
      //   resourcePermission: 'analytics:read',
      // },
    ],
  },
  {
    sectionTitle: "Fleet & Logistics",
    items: [
      {
        id: "operators",
        title: "Bus Operators",
        path: ROUTES.OPERATORS,
        iconName: "Building2",
        resourcePermission: "operators:read",
      },
      {
        id: "Cab Types",
        title: "Cabs and Types",
        path: ROUTES.CABS_TYPE,
        iconName: "Bus",
        resourcePermission: "buses:read",
      },
      {
        id: "drivers",
        title: "Drivers",
        path: ROUTES.DRIVERS,
        iconName: "UserCheck",
        resourcePermission: "drivers:read",
      },
      {
        id: "seats",
        title: "Seat Templates",
        path: ROUTES.SEATS,
        iconName: "Grid",
        resourcePermission: "seats:read",
      },
    ],
  },
  {
    sectionTitle: "Routes & Trips",
    items: [
      {
        id: "routes",
        title: "Routes & Network",
        path: ROUTES.ROUTES,
        iconName: "MapPin",
        resourcePermission: "routes:read",
      },
      {
        id: "stations",
        title: "Terminals & Stops",
        path: ROUTES.STATIONS,
        iconName: "Building",
        resourcePermission: "stations:read",
      },
      {
        id: "schedules",
        title: "Master Schedules",
        path: ROUTES.SCHEDULES,
        iconName: "CalendarDays",
        resourcePermission: "schedules:read",
      },
      {
        id: "trips",
        title: "Live Trips & Dispatch",
        path: ROUTES.TRIPS,
        iconName: "Navigation",
        badge: "Active",
        resourcePermission: "trips:read",
      },
    ],
  },
  {
    sectionTitle: "Bookings & Customers",
    items: [
      {
        id: "bookings",
        title: "Bookings & Tickets",
        path: ROUTES.BOOKINGS,
        iconName: "Ticket",
        resourcePermission: "bookings:read",
      },
      {
        id: "users",
        title: "Passengers & Accounts",
        path: ROUTES.USERS,
        iconName: "Users",
        resourcePermission: "users:read",
      },
      {
        id: "vouchers",
        title: "Vouchers & Offers",
        path: ROUTES.VOUCHERS,
        iconName: "TicketPercent",
        resourcePermission: "vouchers:read",
      },
    ],
  },
  {
    sectionTitle: "Administration",
    items: [
      {
        id: "roles",
        title: "Roles & Permissions",
        path: ROUTES.ROLES,
        iconName: "ShieldCheck",
        resourcePermission: "roles:read",
      },
      {
        id: "settings",
        title: "System Settings",
        path: ROUTES.SETTINGS,
        iconName: "Settings",
        resourcePermission: "settings:read",
      },
    ],
  },
]
