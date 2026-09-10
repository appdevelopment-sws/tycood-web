import type { CreateBusPayload } from "@/services/busService"

export const BUS_FORM_INITIAL_DATA: CreateBusPayload = {
  registrationNumber: "",
  internalCode: "",
  busName: "",
  busType: "SEATER",
  category: "STANDARD",
  manufacturer: "",
  model: "",
  manufacturingYear: new Date().getFullYear(),
  seatingCapacity: 36,
  layoutType: "2x2",
  isAC: true,
  status: "ACTIVE",
  operatorId: "",
}

export const INITIAL_BUS_FILTERS = {
  search: "",
  busType: "ALL",
  status: "ALL",
  operatorId: "ALL",
  isAC: "ALL",
  page: 1,
  perPage: 10,
}

export const BUS_TYPE_OPTIONS = [
  { label: "Seater", value: "SEATER" },
  { label: "Sleeper", value: "SLEEPER" },
  { label: "Semi-Sleeper", value: "SEMI_SLEEPER" },
  { label: "Hybrid (Seater + Sleeper)", value: "HYBRID" },
]

export const BUS_CATEGORY_OPTIONS = [
  { label: "Volvo", value: "VOLVO" },
  { label: "Luxury", value: "LUXURY" },
  { label: "Scania", value: "SCANIA" },
  { label: "Mercedes-Benz", value: "MERCEDES" },
  { label: "Standard", value: "STANDARD" },
  { label: "Deluxe", value: "DELUXE" },
]

export const BUS_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Breakdown", value: "BREAKDOWN" },
  { label: "Retired", value: "RETIRED" },
  { label: "Inactive", value: "INACTIVE" },
]

export const LAYOUT_TYPE_OPTIONS = [
  { label: "2x2 (4 seats per row)", value: "2x2" },
  { label: "2x1 (3 seats per row)", value: "2x1" },
  { label: "Sleeper (Lower & Upper Berths)", value: "SLEEPER" },
]
