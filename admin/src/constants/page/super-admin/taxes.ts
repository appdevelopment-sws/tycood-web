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
  { label: "All Services (Universal: Cabs, Technicians, Parking)", value: "ALL_SERVICES" },
  { label: "All Cab Rides", value: "ALL_RIDES" },
  { label: "Outstation Cab Trips Only", value: "OUTSTATION" },
  { label: "Technicians & Roadside Assistance", value: "TECHNICIAN" },
  { label: "Smart Parking Bookings", value: "PARKING" },
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
  { label: "All Services (Universal)", value: "ALL_SERVICES" },
  { label: "All Cab Rides", value: "ALL_RIDES" },
  { label: "Outstation Only", value: "OUTSTATION" },
  { label: "Technicians & Roadside", value: "TECHNICIAN" },
  { label: "Smart Parking", value: "PARKING" },
]
