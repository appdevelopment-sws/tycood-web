import { apiClient } from "../lib/apiClient"
import type { SystemSettingsResponse, SettingItem } from "../types/setting"

const LOCAL_STORAGE_SETTINGS_KEY = "cab_admin_system_settings"

const DEFAULT_SETTINGS_ITEMS: SettingItem[] = [
  // Maps & Location
  {
    key: "GOOGLE_MAPS_API_KEY",
    value: "",
    category: "MAPS_LOCATION",
    description: "Google Maps JavaScript API & Distance Matrix Key",
    isSecret: true,
  },
  {
    key: "MAPBOX_ACCESS_TOKEN",
    value: "",
    category: "MAPS_LOCATION",
    description: "Mapbox turn-by-turn routing token for navigation",
    isSecret: true,
  },

  // Payment Gateways
  {
    key: "RAZORPAY_KEY_ID",
    value: "",
    category: "PAYMENT_GATEWAY",
    description: "Razorpay Public Merchant Key ID",
    isSecret: false,
  },
  {
    key: "RAZORPAY_KEY_SECRET",
    value: "",
    category: "PAYMENT_GATEWAY",
    description: "Razorpay Merchant Secret Key",
    isSecret: true,
  },
  {
    key: "STRIPE_PUBLISHABLE_KEY",
    value: "",
    category: "PAYMENT_GATEWAY",
    description: "Stripe Publishable Key for card checkout",
    isSecret: false,
  },
  {
    key: "STRIPE_SECRET_KEY",
    value: "",
    category: "PAYMENT_GATEWAY",
    description: "Stripe Secret Key for backend charges",
    isSecret: true,
  },

  // Notifications & SMS
  {
    key: "TWILIO_ACCOUNT_SID",
    value: "",
    category: "NOTIFICATIONS",
    description: "Twilio Account SID for sending rider OTP SMS",
    isSecret: false,
  },
  {
    key: "TWILIO_AUTH_TOKEN",
    value: "",
    category: "NOTIFICATIONS",
    description: "Twilio Authentication Token",
    isSecret: true,
  },
  {
    key: "TWILIO_SENDER_NUMBER",
    value: "",
    category: "NOTIFICATIONS",
    description: "Twilio Registered Sender Phone Number / Sender ID",
    isSecret: false,
  },
  {
    key: "FIREBASE_SERVER_KEY",
    value: "",
    category: "NOTIFICATIONS",
    description: "Firebase Cloud Messaging (FCM) Server Key",
    isSecret: true,
  },

  // Cloud Storage
  {
    key: "S3_BUCKET_NAME",
    value: "cab-booking-storage",
    category: "CLOUD_STORAGE",
    description: "AWS S3 or Cloudflare R2 bucket for KYC documents & cab photos",
    isSecret: false,
  },
  {
    key: "S3_REGION",
    value: "ap-south-1",
    category: "CLOUD_STORAGE",
    description: "AWS S3 Bucket Region",
    isSecret: false,
  },
  {
    key: "S3_ACCESS_KEY",
    value: "",
    category: "CLOUD_STORAGE",
    description: "Cloud Storage Access Key ID",
    isSecret: true,
  },
  {
    key: "S3_SECRET_KEY",
    value: "",
    category: "CLOUD_STORAGE",
    description: "Cloud Storage Secret Access Key",
    isSecret: true,
  },

  // General System Config
  {
    key: "PLATFORM_CURRENCY",
    value: "INR",
    category: "GENERAL",
    description: "Primary currency code (INR, USD, EUR, etc.)",
    isSecret: false,
  },
  {
    key: "PLATFORM_BASE_FEE",
    value: "49",
    category: "GENERAL",
    description: "Platform facilitation service fee charged per ride",
    isSecret: false,
  },
  {
    key: "AUTO_DISPATCH_RADIUS_KM",
    value: "5",
    category: "GENERAL",
    description: "Maximum radius in KM for auto-assigning nearby drivers",
    isSecret: false,
  },
  {
    key: "DRIVER_ACCEPT_TIMEOUT_SEC",
    value: "45",
    category: "GENERAL",
    description: "Seconds driver has to accept incoming dispatch request",
    isSecret: false,
  },
  {
    key: "RIDE_CANCEL_GRACE_MINUTES",
    value: "5",
    category: "GENERAL",
    description: "Free rider cancellation window in minutes",
    isSecret: false,
  },
  {
    key: "SUPPORT_EMAIL",
    value: "support@cabbooking.com",
    category: "GENERAL",
    description: "Customer support email displayed on passenger receipts",
    isSecret: false,
  },
  {
    key: "EMERGENCY_SOS_PHONE",
    value: "112",
    category: "GENERAL",
    description: "Emergency police / SOS helpline dialed on in-app SOS click",
    isSecret: false,
  },
]

function getLocalSettings(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  const initial: Record<string, string> = {}
  DEFAULT_SETTINGS_ITEMS.forEach((i) => {
    initial[i.key] = i.value
  })
  localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(initial))
  return initial
}

function saveLocalSettings(map: Record<string, string>) {
  localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(map))
}

export const settingService = {
  getSettings: async (includeSecrets = false): Promise<SystemSettingsResponse> => {
    try {
      const res = await apiClient<SystemSettingsResponse>(
        `/settings${includeSecrets ? "?includeSecrets=true" : ""}`
      )
      if (res && res.settings) {
        return res
      }
    } catch {
      // fallback
    }

    const localMap = getLocalSettings()
    const settingsMap: Record<string, SettingItem> = {}
    const rawList: SettingItem[] = []

    for (const def of DEFAULT_SETTINGS_ITEMS) {
      const storedVal = localMap[def.key] !== undefined ? localMap[def.key] : def.value
      let displayVal = storedVal
      if (def.isSecret && !includeSecrets && storedVal) {
        displayVal =
          storedVal.length > 8
            ? `${storedVal.slice(0, 4)}••••••••${storedVal.slice(-4)}`
            : "••••••••"
      }
      const item: SettingItem = {
        ...def,
        value: displayVal,
        rawHasValue: Boolean(storedVal),
      }
      settingsMap[def.key] = item
      rawList.push(item)
    }

    return { settings: settingsMap, rawList }
  },

  updateSettings: async (settings: Record<string, string>): Promise<SystemSettingsResponse> => {
    try {
      await apiClient<SystemSettingsResponse>("/settings", {
        method: "PATCH",
        body: JSON.stringify({ settings }),
      })
    } catch {
      // fallback
    }

    const current = getLocalSettings()
    for (const [k, v] of Object.entries(settings)) {
      if (v !== undefined && !String(v).includes("••••")) {
        current[k] = String(v)
      }
    }
    saveLocalSettings(current)
    return settingService.getSettings(false)
  },
}
