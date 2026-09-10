import type { CreateSeatPayload } from "@/services/seatService"

export const SEAT_FORM_INITIAL_DATA: CreateSeatPayload = {
  busId: "",
  seatNumber: "",
  seatType: "SEATER",
  deck: "LOWER",
  row: 1,
  column: 0,
  positionX: 0,
  positionY: 0,
  isWindowSeat: false,
  isAisleSeat: false,
  isLastRow: false,
  isVisible: true,
}

export const INITIAL_SEAT_FILTERS = {
  search: "",
  busId: "",
  deck: "ALL",
  seatType: "ALL",
  page: 1,
  perPage: 20,
}

export const SEAT_TYPE_OPTIONS = [
  { label: "Standard Seater", value: "SEATER" },
  { label: "Sleeper Berth", value: "SLEEPER" },
  { label: "Semi-Sleeper Recliner", value: "SEMI_SLEEPER" },
]

export const SEAT_DECK_OPTIONS = [
  { label: "Lower Deck", value: "LOWER" },
  { label: "Upper Deck", value: "UPPER" },
]

export const LAYOUT_PRESET_OPTIONS = [
  {
    pattern: "2x2",
    name: "2x2 Standard Seater",
    description: "4 seats per row, 36 total capacity (9 rows x 4 columns)",
  },
  {
    pattern: "2x1",
    name: "2x1 Executive Seater",
    description: "3 seats per row with extra aisle room, 30 total capacity (10 rows x 3 columns)",
  },
  {
    pattern: "SLEEPER",
    name: "Double Deck Sleeper",
    description: "24 Luxury Berths across Lower (L1-L12) and Upper (U1-U12) decks",
  },
]
