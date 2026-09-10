import type { CreateUserPayload } from "@/types/user"

export const USER_FORM_INITIAL_DATA: CreateUserPayload = {
  name: "",
  email: "",
  phone: "",
  age: undefined,
  address: "",
  emergencyContact: "",
  password: "",
  status: "ACTIVE",
  isActive: true,
  roleName: "USER",
}

export const INITIAL_USER_FILTERS = {
  search: "",
  status: "",
  role: "",
  page: 1,
  perPage: 10,
}
