import type { CreateTaxPayload, TaxFilterParams } from "@/types/tax"

export const INITIAL_TAX_FILTERS: TaxFilterParams = {
  search: "",
  taxType: "ALL",
  isActive: "ALL",
  applicableOn: "ALL",
}

export const TAX_FORM_INITIAL_DATA: CreateTaxPayload = {
  name: "",
  code: "",
  taxType: "PERCENTAGE",
  rate: 5,
  description: "",
  applicableOn: "ALL_RIDES",
  isIncludedInFare: false,
  isActive: true,
  priority: 1,
}

export const TAX_TYPE_OPTIONS = [
  { label: "Percentage (%)", value: "PERCENTAGE" },
  { label: "Fixed Amount (₹ / Flat)", value: "FIXED" },
]

export const TAX_SCOPE_OPTIONS = [
  { label: "All Rides & Bookings", value: "ALL_RIDES" },
  { label: "Intercity City Cab Trips Only", value: "INTERCITY_ONLY" },
  { label: "Airport Terminal Pickups & Drops", value: "AIRPORT_RIDES" },
  { label: "Night Rides (11 PM - 5 AM)", value: "NIGHT_RIDES" },
  { label: "Outstation Long-Distance Trips", value: "OUTSTATION" },
]

export const TAX_FILTER_TYPE_OPTIONS = [
  { label: "All Types", value: "ALL" },
  { label: "Percentage (%)", value: "PERCENTAGE" },
  { label: "Fixed Fee", value: "FIXED" },
]

export const TAX_FILTER_STATUS_OPTIONS = [
  { label: "All Status", value: "ALL" },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
]

export const TAX_FILTER_SCOPE_OPTIONS = [
  { label: "All Scopes", value: "ALL" },
  { label: "All Rides", value: "ALL_RIDES" },
  { label: "Intercity Only", value: "INTERCITY_ONLY" },
  { label: "Airport Rides", value: "AIRPORT_RIDES" },
  { label: "Night Rides", value: "NIGHT_RIDES" },
  { label: "Outstation", value: "OUTSTATION" },
]
