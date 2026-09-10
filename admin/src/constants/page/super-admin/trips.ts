import type { CreateTripPayload } from "@/services/tripService"

export const TRIP_FORM_INITIAL_DATA: CreateTripPayload = {
  busId: "",
  routeId: "",
  driverId: "",
  scheduleId: "",
  departureTime: "",
  arrivalTime: "",
  minFare: 500,
  tripCode: "",
  status: "SCHEDULED",
}

export const INITIAL_TRIP_FILTERS = {
  search: "",
  status: "",
  routeId: "",
  busId: "",
  driverId: "",
  startDate: "",
  endDate: "",
  page: 1,
  limit: 100,
}
