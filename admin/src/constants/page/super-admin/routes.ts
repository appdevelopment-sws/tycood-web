import type { CreateRoutePayload } from "@/services/routeService"

export const ROUTE_FORM_INITIAL_DATA: CreateRoutePayload = {
  name: "",
  sourceStationId: "",
  destinationStationId: "",
  distanceKm: 0,
  estimatedDurationMinutes: 0,
  isActive: true,
  stops: [],
}

export const INITIAL_ROUTE_FILTERS = {
  search: "",
  sourceStationId: "",
  destinationStationId: "",
  isActive: "",
  page: 1,
  perPage: 10,
}
