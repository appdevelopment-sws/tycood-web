import type { CreateDriverPayload } from "@/services/driverService"

export const DRIVER_FORM_INITIAL_DATA: CreateDriverPayload = {
  operatorId: "",
  name: "",
  phone: "",
  licenseNumber: "",
  experienceYears: 0,
  rating: 5.0,
  status: "ACTIVE",
}

export const INITIAL_DRIVER_FILTERS = {
  search: "",
  operatorId: "",
  status: "",
  page: 1,
  perPage: 10,
}
