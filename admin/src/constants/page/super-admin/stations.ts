import type { CreateStationPayload } from "@/services/stationService"

export const STATION_FORM_INITIAL_DATA: CreateStationPayload = {
  name: "",
  city: "",
  state: "",
  terminalName: "",
  latitude: 0,
  longitude: 0,
  isActive: true,
}

export const INITIAL_STATION_FILTERS = {
  search: "",
  isActive: "",
  page: 1,
  perPage: 10,
}
