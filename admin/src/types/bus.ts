/**
 * Bus Platform Domain Entities
 */

export interface BusOperator {
  id: string;
  name: string;
  code: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
  totalFleetCount?: number;
  activeTripsCount?: number;
  rating?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt?: string;
  updatedAt?: string;
}

export interface Driver {
  id: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  operatorId: string;
  operator?: BusOperator;
  name: string;
  phone: string;
  licenseNumber: string;
  experienceYears?: number;
  rating?: number;
  status: 'ACTIVE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
  createdAt?: string;
  updatedAt?: string;

  // Computed / UI compatibility fields
  operatorName?: string;
}

export type BusTypeEnum = 'SLEEPER' | 'SEATER' | 'SEMI_SLEEPER' | 'HYBRID';
export type BusCategoryEnum = 'VOLVO' | 'LUXURY' | 'SCANIA' | 'MERCEDES' | 'STANDARD' | 'DELUXE';
export type BusStatusEnum = 'ACTIVE' | 'MAINTENANCE' | 'BREAKDOWN' | 'RETIRED' | 'INACTIVE';

export interface Bus {
  id: string;
  registrationNumber: string;
  internalCode?: string;
  busName: string;
  busType: BusTypeEnum | string;
  category?: BusCategoryEnum | string;
  manufacturer?: string;
  model?: string;
  manufacturingYear?: number;
  seatingCapacity: number;
  layoutType?: string;
  isAC: boolean;
  status: BusStatusEnum | string;
  operatorId?: string;
  operator?: BusOperator;
  amenities?: any[];
  seats?: any[];
  images?: any[];
  createdAt?: string;
  updatedAt?: string;

  // Computed / legacy compatibility fields
  operatorName?: string;
  modelName?: string;
  totalSeats?: number;
}

export interface Station {
  id: string;
  name: string;
  city: string;
  state?: string;
  terminalName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  code?: string;
  isActive?: boolean;
}

export type StopTypeEnum = 'BOARDING' | 'DROPPING' | 'BOTH';

export interface RouteStop {
  id?: string;
  routeId?: string;
  stationId: string;
  station?: Station;
  stopOrder: number;
  stopType: StopTypeEnum;
  timeOffsetMinutes: number;
  fareMarkup?: number;
}

export interface Route {
  id: string;
  name: string;
  sourceStationId: string;
  sourceStation?: Station;
  destinationStationId: string;
  destinationStation?: Station;
  distanceKm: number;
  estimatedDurationMinutes: number;
  stops?: RouteStop[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Computed / UI compatibility fields
  routeName?: string;
  originStationId?: string;
  originCity?: string;
  destinationCity?: string;
  estimatedDurationHours?: number;
  intermediateStopsCount?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  viewMode?: boolean;
}

export interface Schedule {
  id: string;
  routeId: string;
  routeName: string;
  busId: string;
  busRegistration: string;
  departureTime: string;
  arrivalTime: string;
  frequency: 'DAILY' | 'WEEKDAYS' | 'WEEKENDS';
  basePrice: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Trip {
  id: string;
  scheduleId?: string;
  tripCode: string;
  routeName: string;
  busRegistration: string;
  operatorName: string;
  driverName: string;
  driverPhone: string;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  totalSeats: number;
  farePrice: number;
  minFare?: number;
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED' | 'DELAYED';

  busId?: string;
  routeId?: string;
  driverId?: string;
  driver?: Driver;
  bus?: Bus;
  route?: Route;
  viewMode?: boolean;
}

export type SeatTypeEnum = 'SEATER' | 'SLEEPER' | 'SEMI_SLEEPER';
export type SeatDeckEnum = 'LOWER' | 'UPPER';

export interface Seat {
  id: string;
  busId: string;
  seatNumber: string;
  seatType: SeatTypeEnum | string;
  deck: SeatDeckEnum | string;
  row: number;
  column: number;
  positionX?: number;
  positionY?: number;
  isWindowSeat: boolean;
  isAisleSeat: boolean;
  isLastRow: boolean;
  isVisible: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Transient / legacy compatibility fields
  viewMode?: boolean;
  bus?: Bus;
  // Legacy trip-seat compatibility fallback
  isAvailable?: boolean;
  price?: number;
  type?: string;
}

export interface PassengerInfo {
  id?: string;
  name: string;
  age: number;
  gender: string;
  seatNumber: string;
  farePaid?: number;
  email?: string;
  phone?: string;
}

export interface Booking {
  id: string;
  pnr?: string;
  ticketNumber: string;
  tripId: string;
  routeName: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  operatorName?: string;
  operatorLogoText?: string;
  busCategory?: string;
  busRegistration?: string;
  seatNumbers: string[];
  totalAmount: number;
  totalPaidAmount?: number;
  advanceAmount?: number;
  remainingAmount?: number;
  adminCommissionRate?: number;
  paymentMethod: 'CARD' | 'UPI' | 'WALLET' | 'CASH' | string;
  paymentStatus?: 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED' | 'ADVANCE_PAID' | string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED' | string;
  rawStatus?: string;
  fromCity?: string;
  fromStation?: string;
  toCity?: string;
  toStation?: string;
  departureDate?: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  duration?: string;
  bookedAt: string;
  createdAt?: string;
  passengers?: PassengerInfo[];
  viewMode?: boolean;
}

export interface CreateBookingPassengerInput {
  fullName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
  seatNumber: string;
  email?: string;
  phone?: string;
}

export interface CreateBookingPayload {
  tripId: string;
  boardingPointLocation?: string;
  droppingPointLocation?: string;
  passengers: CreateBookingPassengerInput[];
  totalAmount: number;
  paymentMethod?: string;
}


export interface AnalyticsMetric {
  id: string;
  title: string;
  value: string | number;
  changePercent: number;
  trend: 'up' | 'down';
  description: string;
}
