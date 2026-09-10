import { apiClient } from "../lib/apiClient"
import type { Seat, SeatTypeEnum, SeatDeckEnum } from "../types/bus"

export interface CreateSeatPayload {
  busId: string
  seatNumber: string
  seatType?: SeatTypeEnum | string
  deck?: SeatDeckEnum | string
  row: number
  column: number
  positionX?: number
  positionY?: number
  isWindowSeat?: boolean
  isAisleSeat?: boolean
  isLastRow?: boolean
  isVisible?: boolean
}

export interface UpdateSeatPayload {
  busId?: string
  seatNumber?: string
  seatType?: SeatTypeEnum | string
  deck?: SeatDeckEnum | string
  row?: number
  column?: number
  positionX?: number
  positionY?: number
  isWindowSeat?: boolean
  isAisleSeat?: boolean
  isLastRow?: boolean
  isVisible?: boolean
}

export const seatService = {
  getSeatsByBusId: async (busId: string): Promise<Seat[]> => {
    if (!busId) return []
    return apiClient<Seat[]>(`/seat/bus/${busId}`)
  },

  getSeatById: async (id: string): Promise<Seat> => {
    return apiClient<Seat>(`/seat/${id}`)
  },

  createSeat: async (payload: CreateSeatPayload): Promise<Seat> => {
    return apiClient<Seat>("/seat", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  bulkCreateSeats: async (payloads: CreateSeatPayload[]): Promise<Seat[]> => {
    return apiClient<Seat[]>("/seat/bulk", {
      method: "POST",
      body: JSON.stringify(payloads),
    })
  },

  updateSeat: async (id: string, payload: UpdateSeatPayload): Promise<Seat> => {
    return apiClient<Seat>(`/seat/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  deleteSeat: async (id: string): Promise<{ success: boolean; message?: string }> => {
    return apiClient<{ success: boolean; message?: string }>(`/seat/${id}`, {
      method: "DELETE",
    })
  },

  deleteSeatsByBus: async (busId: string): Promise<{ success: boolean; message?: string }> => {
    return apiClient<{ success: boolean; message?: string }>(`/seat/bus/${busId}`, {
      method: "DELETE",
    })
  },

  generateSeatLayout: async (busId: string, layoutPattern: string): Promise<Seat[]> => {
    return apiClient<Seat[]>(`/bus/${busId}/generate-seats`, {
      method: "POST",
      body: JSON.stringify({ layoutPattern }),
    })
  },
}
