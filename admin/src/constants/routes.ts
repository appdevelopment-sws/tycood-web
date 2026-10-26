/**
 * Application Routes & Navigation Setup
 */

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/",
  OPERATORS: "/operators",
  CABS_TYPE: "/cabs-type",
  TRUCK_TYPES: "/truck-types",
  LOADS: "/loads",
  ROUTES: "/routes",
  STATIONS: "/stations",
  SCHEDULES: "/schedules",
  TRIPS: "/trips",
  BOOKINGS: "/bookings",
  USERS: "/users",
  VOUCHERS: "/vouchers",
  DRIVERS: "/drivers",
  MECHANICS: "/mechanics",
  PARKING: "/parking",
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
    ],
  },
  {
    sectionTitle: "Fleet & Logistics",
    items: [
      {
        id: "Cab Types",
        title: "Cabs and Types",
        path: ROUTES.CABS_TYPE,
        iconName: "Bus",
        resourcePermission: "buses:read",
      },
      {
        id: "truck-types",
        title: "Truck & Vehicle Types",
        path: ROUTES.TRUCK_TYPES,
        iconName: "Truck",
        resourcePermission: "buses:read",
      },
      {
        id: "loads",
        title: "Freight Cargo Loads",
        path: ROUTES.LOADS,
        iconName: "Package",
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
        id: "mechanics",
        title: "Mechanics / Technicians",
        path: ROUTES.MECHANICS,
        iconName: "Wrench",
        resourcePermission: "drivers:read",
      },
      {
        id: "parking",
        title: "Parking Facilities",
        path: ROUTES.PARKING,
        iconName: "SquareParking",
        resourcePermission: "operators:read",
      },
    ],
  },
  // {
  //   sectionTitle: "Routes & Trips",
  //   items: [
  //     {
  //       id: "routes",
  //       title: "Routes & Network",
  //       path: ROUTES.ROUTES,
  //       iconName: "MapPin",
  //       resourcePermission: "routes:read",
  //     },
  //     {
  //       id: "stations",
  //       title: "Terminals & Stops",
  //       path: ROUTES.STATIONS,
  //       iconName: "Building",
  //       resourcePermission: "stations:read",
  //     },
  //     {
  //       id: "schedules",
  //       title: "Master Schedules",
  //       path: ROUTES.SCHEDULES,
  //       iconName: "CalendarDays",
  //       resourcePermission: "schedules:read",
  //     },
  //     {
  //       id: "trips",
  //       title: "Live Trips & Dispatch",
  //       path: ROUTES.TRIPS,
  //       iconName: "Navigation",
  //       badge: "Active",
  //       resourcePermission: "trips:read",
  //     },
  //   ],
  // },
  {
    sectionTitle: "Bookings & Customers",
    items: [
      {
        id: "bookings",
        title: "Bookings",
        path: ROUTES.BOOKINGS,
        iconName: "Ticket",
        resourcePermission: "bookings:read",
      },
      {
        id: "users",
        title: "Users",
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
      // {
      //   id: "roles",
      //   title: "Roles & Permissions",
      //   path: ROUTES.ROLES,
      //   iconName: "ShieldCheck",
      //   resourcePermission: "roles:read",
      // },
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
