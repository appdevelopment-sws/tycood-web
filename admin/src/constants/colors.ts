/**
 * Admin Panel Color System & Semantic Color Tokens
 * All colors and status badges map to standard tailwind classes or hex definitions
 */

export const COLOR_TOKENS = {
  PRIMARY: " hover:bg-indigo-700 text-white",
  PRIMARY_TEXT: "text-indigo-600 dark:text-indigo-400",
  PRIMARY_BG_SUBTLE:
    "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300",

  SECONDARY:
    "bg-slate-800 dark:bg-slate-100 text-slate-100 dark:text-slate-900",
  MUTED_BG: "bg-slate-100 dark:bg-slate-900",
  BORDER: "border-slate-200 dark:border-slate-800",

  CARD_BG:
    "bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80",
  HEADER_BG:
    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80",
  SIDEBAR_BG: "bg-slate-900 text-slate-300 border-r border-slate-800",
} as const

export const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  // General Statuses
  ACTIVE: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    label: "Active",
  },
  INACTIVE: {
    bg: "bg-slate-100 dark:bg-slate-800/60",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-700",
    label: "Inactive",
  },
  PENDING: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    label: "Pending",
  },
  MAINTENANCE: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    label: "Maintenance",
  },

  // Booking & Trip Statuses
  CONFIRMED: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    label: "Confirmed",
  },
  CANCELLED: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
    label: "Cancelled",
  },
  SCHEDULED: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    label: "Scheduled",
  },
  IN_TRANSIT: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
    label: "In Transit",
  },
  COMPLETED: {
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-teal-200 dark:border-teal-800",
    label: "Completed",
  },
  DELAYED: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    label: "Delayed",
  },
}

export const ROLE_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  SUPER_ADMIN: {
    bg: "bg-purple-100 dark:bg-purple-950/50",
    text: "text-purple-700 dark:text-purple-300",
  },
  BUS_OPERATOR: {
    bg: "bg-blue-100 dark:bg-blue-950/50",
    text: "text-blue-700 dark:text-blue-300",
  },
  DISPATCHER: {
    bg: "bg-amber-100 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
  },
  FINANCE_ADMIN: {
    bg: "bg-emerald-100 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  SUPPORT_AGENT: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
  },
}
