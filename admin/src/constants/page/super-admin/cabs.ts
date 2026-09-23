import type { CreateCabPayload } from "@/types/cab"

export const CAB_FORM_INITIAL_DATA: CreateCabPayload = {
  make: "Maruti Suzuki",
  model: "WagonR ZXI",
  registrationNumber: "",
  vehicleCategory: "Hatchback",
  color: "Silky Silver",
  manufacturingYear: String(new Date().getFullYear()),
  fuelType: "CNG + Petrol",
  seatingCapacity: 4,
  luggageCapacity: 1,

  // Pricing Engine
  baseFare: 699,
  baseKm: 10,
  perKmCharge: 12,
  extraKmCharge: 15,
  roundoffCostPerKm: 11,
  outstationBaseCharge: 2299,
  outstationPerKmCharge: 13.5,
  originalFare: 839,

  // App Card Presentation
  badgeTag: "FASTEST",
  rating: 4.8,
  reviewsCount: 412,
  etaMinutes: 6,
  imageUrl: "assets/car.png",
  features: ["Compact & Fast", "AC Included", "Best City Commute", "Instant Dispatch"],

  hasAc: true,
  tollIncluded: true,
  freeCancellation: true,
  isInstant: true,
  status: "ACTIVE",
}

export const INITIAL_CAB_FILTERS = {
  search: "",
  category: "ALL",
  status: "ALL",
  fuelType: "ALL",
  page: 1,
  limit: 10,
}

export const CAB_CATEGORY_OPTIONS = [
  { label: "Hatchback (Quick Commute)", value: "Hatchback" },
  { label: "Sedan (Comfort Sedan)", value: "Sedan" },
  { label: "SUV / XL (6-7 Seats)", value: "SUV / XL" },
  { label: "Electric (EV) (Zero Emission)", value: "Electric (EV)" },
  { label: "Luxury (VIP Chauffeur)", value: "Luxury" },
]

export const CAB_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Breakdown", value: "BREAKDOWN" },
  { label: "Retired", value: "RETIRED" },
  { label: "Inactive", value: "INACTIVE" },
]

export const CAB_FUEL_OPTIONS = [
  { label: "CNG + Petrol", value: "CNG + Petrol" },
  { label: "Petrol", value: "Petrol" },
  { label: "Diesel", value: "Diesel" },
  { label: "Electric (EV)", value: "Electric (EV)" },
  { label: "Hybrid", value: "Hybrid" },
]

export const BADGE_TAG_OPTIONS = [
  { label: "None", value: "" },
  { label: "FASTEST", value: "FASTEST" },
  { label: "BEST VALUE", value: "BEST VALUE" },
  { label: "POPULAR", value: "POPULAR" },
  { label: "TOP RATED", value: "TOP RATED" },
  { label: "LUXURY", value: "LUXURY" },
  { label: "ECO-FRIENDLY", value: "ECO-FRIENDLY" },
  { label: "SPACIOUS", value: "SPACIOUS" },
]
