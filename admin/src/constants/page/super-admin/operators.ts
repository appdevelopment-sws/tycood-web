import type { CreateOperatorPayload } from "@/services/operatorService"

export const OPERATOR_FORM_INITIAL_DATA: CreateOperatorPayload = {
  name: "",
  code: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  status: "ACTIVE",
  logoUrl: "",
}

export const INITIAL_OPERATOR_FILTERS = {
  search: "",
  page: 1,
  perPage: 10,
}
