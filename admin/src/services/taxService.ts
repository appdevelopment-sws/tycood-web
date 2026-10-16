import { apiClient } from "../lib/apiClient"
import type { Tax, CreateTaxPayload, UpdateTaxPayload, TaxFilterParams } from "../types/tax"

const LOCAL_STORAGE_TAXES_KEY = "cab_admin_custom_taxes"

const DEFAULT_PRESET_TAXES: Tax[] = [
  {
    id: "tax-default-platform-fee",
    name: "Platform Convenience Fee",
    code: "PLATFORM_FEE",
    taxType: "FIXED",
    rate: 40.0,
    description: "Standard aggregated platform access, emergency dispatch and technology convenience fee",
    applicableOn: "ALL_SERVICES",
    isIncludedInFare: false,
    isActive: true,
    priority: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tax-default-gst5",
    name: "Goods & Services Tax (GST 5%)",
    code: "GST_5",
    taxType: "PERCENTAGE",
    rate: 5.0,
    description: "Standard statutory tax applied to passenger taxi & cab journeys",
    applicableOn: "ALL_RIDES",
    isIncludedInFare: false,
    isActive: true,
    priority: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tax-default-cgst",
    name: "Central GST (CGST 2.5%)",
    code: "CGST_2_5",
    taxType: "PERCENTAGE",
    rate: 2.5,
    description: "Central component of Goods & Services Tax",
    applicableOn: "ALL_RIDES",
    isIncludedInFare: false,
    isActive: false,
    priority: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tax-default-sgst",
    name: "State GST (SGST 2.5%)",
    code: "SGST_2_5",
    taxType: "PERCENTAGE",
    rate: 2.5,
    description: "State component of Goods & Services Tax",
    applicableOn: "ALL_RIDES",
    isIncludedInFare: false,
    isActive: false,
    priority: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tax-default-airport",
    name: "Airport Convenience & Terminal Cess",
    code: "AIRPORT_CESS",
    taxType: "FIXED",
    rate: 60.0,
    description: "Terminal facilitation charge for airport departures and pickups",
    applicableOn: "AIRPORT_RIDES",
    isIncludedInFare: false,
    isActive: true,
    priority: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tax-default-night",
    name: "Night Peak & Safety Surcharge (10%)",
    code: "NIGHT_SURCHARGE_10",
    taxType: "PERCENTAGE",
    rate: 10.0,
    description: "Operational night surcharge applied from 11:00 PM to 05:00 AM",
    applicableOn: "NIGHT_RIDES",
    isIncludedInFare: false,
    isActive: true,
    priority: 5,
    createdAt: new Date().toISOString(),
  },
]

function getLocalTaxes(): Tax[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TAXES_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore json error
  }
  localStorage.setItem(LOCAL_STORAGE_TAXES_KEY, JSON.stringify(DEFAULT_PRESET_TAXES))
  return DEFAULT_PRESET_TAXES
}

function saveLocalTaxes(list: Tax[]) {
  localStorage.setItem(LOCAL_STORAGE_TAXES_KEY, JSON.stringify(list))
}

export const taxService = {
  getTaxes: async (params?: TaxFilterParams): Promise<Tax[]> => {
    try {
      const q = new URLSearchParams()
      if (params?.search) q.append("search", params.search)
      if (params?.taxType && params.taxType !== "ALL") q.append("taxType", params.taxType)
      if (params?.isActive && params.isActive !== "ALL") q.append("isActive", params.isActive)
      if (params?.applicableOn && params.applicableOn !== "ALL")
        q.append("applicableOn", params.applicableOn)

      const qs = q.toString()
      const url = qs ? `/taxes?${qs}` : "/taxes"
      const res = await apiClient<any>(url)

      const result = Array.isArray(res) ? res : res?.data || []
      if (result.length > 0) {
        saveLocalTaxes(result)
        return result
      }
    } catch {
      // Fallback gracefully to localStorage
    }

    // Filter local taxes
    let local = getLocalTaxes()
    if (params?.search) {
      const s = params.search.toLowerCase()
      local = local.filter(
        (t) =>
          t.name.toLowerCase().includes(s) ||
          t.code.toLowerCase().includes(s) ||
          (t.description && t.description.toLowerCase().includes(s))
      )
    }
    if (params?.taxType && params.taxType !== "ALL") {
      local = local.filter((t) => t.taxType === params.taxType)
    }
    if (params?.isActive && params.isActive !== "ALL") {
      const activeBool = params.isActive === "true"
      local = local.filter((t) => t.isActive === activeBool)
    }
    if (params?.applicableOn && params.applicableOn !== "ALL") {
      local = local.filter((t) => t.applicableOn === params.applicableOn)
    }
    return local
  },

  getTaxById: async (id: string): Promise<Tax> => {
    try {
      return await apiClient<Tax>(`/taxes/${id}`)
    } catch {
      const list = getLocalTaxes()
      const found = list.find((t) => t.id === id)
      if (found) return found
      throw new Error(`Tax with ID ${id} not found`)
    }
  },

  createTax: async (payload: CreateTaxPayload): Promise<Tax> => {
    const code = payload.code.trim().toUpperCase().replace(/\s+/g, "_")
    try {
      const created = await apiClient<Tax>("/taxes", {
        method: "POST",
        body: JSON.stringify({ ...payload, code }),
      })
      const list = getLocalTaxes()
      saveLocalTaxes([created, ...list.filter((t) => t.id !== created.id)])
      return created
    } catch {
      // Local fallback
      const list = getLocalTaxes()
      const newTax: Tax = {
        id: "tax-" + Math.random().toString(36).substring(2, 9),
        name: payload.name.trim(),
        code,
        taxType: payload.taxType,
        rate: Number(payload.rate),
        description: payload.description,
        applicableOn: payload.applicableOn,
        isIncludedInFare: Boolean(payload.isIncludedInFare),
        isActive: Boolean(payload.isActive),
        priority: payload.priority ?? list.length + 1,
        createdAt: new Date().toISOString(),
      }
      saveLocalTaxes([newTax, ...list])
      return newTax
    }
  },

  updateTax: async (id: string, payload: UpdateTaxPayload): Promise<Tax> => {
    try {
      const updated = await apiClient<Tax>(`/taxes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
      const list = getLocalTaxes()
      saveLocalTaxes(list.map((t) => (t.id === id ? updated : t)))
      return updated
    } catch {
      const list = getLocalTaxes()
      const updatedList = list.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            ...payload,
            rate: payload.rate !== undefined ? Number(payload.rate) : t.rate,
            code: payload.code ? payload.code.trim().toUpperCase() : t.code,
            updatedAt: new Date().toISOString(),
          }
        }
        return t
      })
      saveLocalTaxes(updatedList)
      const found = updatedList.find((t) => t.id === id)
      if (found) return found
      throw new Error(`Tax with ID ${id} not found`)
    }
  },

  toggleActive: async (id: string, isActive?: boolean): Promise<Tax> => {
    try {
      const res = await apiClient<Tax>(`/taxes/${id}/toggle-active`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      })
      const list = getLocalTaxes()
      saveLocalTaxes(list.map((t) => (t.id === id ? res : t)))
      return res
    } catch {
      const list = getLocalTaxes()
      let updatedTax: Tax | null = null
      const updatedList = list.map((t) => {
        if (t.id === id) {
          const nextState = isActive !== undefined ? isActive : !t.isActive
          updatedTax = { ...t, isActive: nextState, updatedAt: new Date().toISOString() }
          return updatedTax
        }
        return t
      })
      saveLocalTaxes(updatedList)
      if (updatedTax) return updatedTax
      throw new Error(`Tax with ID ${id} not found`)
    }
  },

  deleteTax: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await apiClient<{ success: boolean; message: string }>(`/taxes/${id}`, {
        method: "DELETE",
      })
    } catch {
      // local delete
    }
    const list = getLocalTaxes()
    saveLocalTaxes(list.filter((t) => t.id !== id))
    return { success: true, message: "Tax deleted successfully" }
  },

  seedPresets: async (): Promise<Tax[]> => {
    try {
      const res = await apiClient<Tax[]>("/taxes/seed-presets", {
        method: "POST",
      })
      if (Array.isArray(res) && res.length > 0) {
        saveLocalTaxes(res)
        return res
      }
    } catch {
      // ignore
    }
    saveLocalTaxes(DEFAULT_PRESET_TAXES)
    return DEFAULT_PRESET_TAXES
  },
}
