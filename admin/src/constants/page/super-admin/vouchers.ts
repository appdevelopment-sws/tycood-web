import type { CreateVoucherPayload } from "@/types/voucher"

export const INITIAL_VOUCHER_FILTERS = {
  search: "",
  status: "",
  isVisible: "",
  page: 1,
  limit: 10,
}

export const VOUCHER_FORM_INITIAL_DATA: CreateVoucherPayload = {
  code: "",
  title: "",
  description: "",
  discountType: "FIXED",
  discountValue: 0,
  minBookingAmount: 0,
  maxDiscountAmount: undefined,
  validFrom: undefined,
  validUntil: undefined,
  usageLimit: undefined,
  perUserLimit: 1,
  tripId: "",
  isVisible: true,
  isActive: true,
}
