export interface SettingItem {
  key: string
  value: string
  rawHasValue?: boolean
  category: 'MAPS_LOCATION' | 'PAYMENT_GATEWAY' | 'NOTIFICATIONS' | 'CLOUD_STORAGE' | 'GENERAL' | string
  description?: string
  isSecret?: boolean
  updatedAt?: string
}

export interface SystemSettingsResponse {
  settings: Record<string, SettingItem>
  rawList: SettingItem[]
}

export interface UpdateSettingsPayload {
  settings: Record<string, string>
}
