export type DiscountType = 'PERCENTAGE' | 'FIXED'

export interface Voucher {
  id: string
  code: string
  title: string
  description?: string
  discountType: DiscountType
  discountValue: number
  minBookingAmount: number
  maxDiscountAmount?: number
  validFrom?: string
  validUntil?: string
  usageLimit?: number
  usedCount: number
  perUserLimit?: number
  tripId?: string | null
  trip?: any
  isVisible: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateVoucherPayload {
  code: string
  title: string
  description?: string
  discountType: DiscountType
  discountValue: number
  minBookingAmount?: number
  maxDiscountAmount?: number
  validFrom?: string
  validUntil?: string
  usageLimit?: number
  perUserLimit?: number
  tripId?: string | null
  isVisible?: boolean
  isActive?: boolean
}

export type UpdateVoucherPayload = Partial<CreateVoucherPayload>
