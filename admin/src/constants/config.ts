/**
 * Application Configuration & Storage Constants
 */

export const APP_CONFIG = {
  TITLE: "Cab Booking Admin Console",
  LOGO_TEXT: "Cab Booking App",
  VERSION: "v1.4.0",
  COPYRIGHT: "© 2026 Cab booking Systems. All rights reserved.",
  API_BASE_URL:
    (import.meta.env.VITE_API_URL as string) ||
    (import.meta.env.VITE_API_BASE_URL as string) ||
    "/api",

  STORAGE_KEYS: {
    AUTH_TOKEN: "cab_admin_token",
    AUTH_USER: "cab_admin_user",
    THEME: "cab_admin_theme",       
    SIDEBAR_COLLAPSED: "cab_admin_sidebar_collapsed",         
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  },

  FORMATS: {
    DATE: "MMM dd, yyyy",
    TIME: "hh:mm a",
    DATETIME: "MMM dd, yyyy • hh:mm a",
    CURRENCY: "INR",
  },
} as const
