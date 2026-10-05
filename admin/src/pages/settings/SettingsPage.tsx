import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  User,
  Mail,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Percent,
  KeyRound,
  Sliders,
  Receipt,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Check,
  CreditCard,
  Cloud,
  MapPin,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "../../hooks/useAuth"
import { Button } from "../../components/ui/button"
import { ROLE_BADGE_COLORS } from "../../constants/colors"
import { queryKeys } from "../../lib/queryKeys"
import { useDisclosure } from "../../hooks/useDisclosure"
import useSearchFilter from "../../hooks/useSearchFilter"
import SectionCard from "../../components/SectionCard"
import { FilterBar } from "../../components/filter-bar"
import { DataTable, type Column } from "../../components/common/DataTable"
import { ConfirmDialog } from "../../components/confirmDialog"

import { taxService } from "../../services/taxService"
import { settingService } from "../../services/settingService"
import TaxDrawer from "../../components/dialog/TaxDrawer"
import type { Tax } from "../../types/tax"
import {
  INITIAL_TAX_FILTERS,
  TAX_FILTER_TYPE_OPTIONS,
  TAX_FILTER_STATUS_OPTIONS,
  TAX_FILTER_SCOPE_OPTIONS,
} from "../../constants/page/super-admin/taxes"

type SettingsTab = "taxes" | "keys" | "general" | "profile"

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { user, updateProfile, refreshProfile } = useAuth()

  const [activeTab, setActiveTab] = useState<SettingsTab>("taxes")

  // --- Profile State ---
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
    }
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileMessage(null)
    try {
      const res = await updateProfile({
        name: name.trim(),
        email: email.trim(),
      })
      if (res.success) {
        setProfileMessage({
          type: "success",
          text: "Profile details updated successfully!",
        })
        toast.success("Profile updated successfully")
      } else {
        setProfileMessage({
          type: "error",
          text: res.error || "Failed to update profile.",
        })
        toast.error(res.error || "Failed to update profile")
      }
    } catch (err: any) {
      setProfileMessage({
        type: "error",
        text: err.message || "An unexpected error occurred.",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  // ==========================================
  // 1. TAXES & SURCHARGES SECTION
  // ==========================================
  const taxDrawerDisclosure = useDisclosure<any>()
  const deleteTaxDisclosure = useDisclosure<any>()
  const { filter: taxFilter, handleFilter: handleTaxFilter } =
    useSearchFilter(INITIAL_TAX_FILTERS)

  const { data: taxesList = [], isLoading: isLoadingTaxes } = useQuery({
    queryKey: queryKeys.taxes.list(taxFilter),
    queryFn: () => taxService.getTaxes(taxFilter),
  })

  const deleteTaxMutation = useMutation({
    mutationFn: (id: string) => taxService.deleteTax(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taxes.all })
      deleteTaxDisclosure.onClose()
      toast.success("Tax definition deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete tax")
    },
  })

  const toggleTaxMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      taxService.toggleActive(id, isActive),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taxes.all })
      toast.success(
        updated.isActive
          ? `Tax "${updated.name}" is now ACTIVE`
          : `Tax "${updated.name}" is now INACTIVE`
      )
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to toggle tax status")
    },
  })

  const seedPresetsMutation = useMutation({
    mutationFn: () => taxService.seedPresets(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taxes.all })
      toast.success("Industry tax presets loaded successfully")
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to load presets")
    },
  })

  const handleOpenTaxDrawer = (
    tax: any = null,
    mode: "create" | "edit" | "view" = "create"
  ) => {
    taxDrawerDisclosure.onOpen(
      tax ? { ...tax, viewMode: mode === "view" } : null
    )
  }

  const handleTaxFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleTaxFilter({ ...updates, page: 1 })
    },
    [handleTaxFilter]
  )

  const activeTaxesCount = useMemo(
    () => taxesList.filter((t) => t.isActive).length,
    [taxesList]
  )
  const percentageTaxesCount = useMemo(
    () => taxesList.filter((t) => t.taxType === "PERCENTAGE").length,
    [taxesList]
  )
  const fixedTaxesCount = useMemo(
    () => taxesList.filter((t) => t.taxType === "FIXED").length,
    [taxesList]
  )

  const taxColumns: Column<Tax>[] = useMemo(
    () => [
      {
        header: "Tax Name & Code",
        accessorKey: "name",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 font-bold text-amber-600 dark:text-amber-400">
              <Receipt className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {row.name}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-indigo-600 uppercase dark:bg-indigo-950/50 dark:text-indigo-400">
                  {row.code}
                </span>
                {row.description && (
                  <span className="max-w-[220px] truncate text-[11px] text-slate-400">
                    {row.description}
                  </span>
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Rate / Surcharge",
        accessorKey: "rate",
        cell: (row) => (
          <div>
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              {row.taxType === "PERCENTAGE" ? `${row.rate}%` : `₹${row.rate}`}
            </span>
            <span className="ml-1.5 text-[11px] text-slate-400">
              {row.taxType === "PERCENTAGE" ? "of base fare" : "flat fee"}
            </span>
          </div>
        ),
      },
      {
        header: "Applicable Scope",
        accessorKey: "applicableOn",
        cell: (row) => {
          const scopeLabels: Record<string, { label: string; bg: string }> = {
            ALL_RIDES: {
              label: "All Rides",
              bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
            },
            INTERCITY_ONLY: {
              label: "Intercity Cab",
              bg: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
            },
            AIRPORT_RIDES: {
              label: "Airport Rides",
              bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
            },
            NIGHT_RIDES: {
              label: "Night Rides",
              bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
            },
            OUTSTATION: {
              label: "Outstation",
              bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
            },
          }
          const info = scopeLabels[row.applicableOn] || {
            label: row.applicableOn,
            bg: "bg-slate-100 text-slate-700",
          }
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${info.bg}`}
            >
              {info.label}
            </span>
          )
        },
      },
      {
        header: "Fare Mode",
        accessorKey: "isIncludedInFare",
        cell: (row) => (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
              row.isIncludedInFare
                ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
            }`}
          >
            {row.isIncludedInFare ? "Included in Base" : "+ Added on Top"}
          </span>
        ),
      },
      {
        header: "Status",
        accessorKey: "isActive",
        cell: (row) => (
          <button
            type="button"
            onClick={() =>
              toggleTaxMutation.mutate({
                id: row.id,
                isActive: !row.isActive,
              })
            }
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              row.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
            }`}
            title={row.isActive ? "Click to disable" : "Click to enable"}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                row.isActive ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        ),
      },
      {
        header: "Actions",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleOpenTaxDrawer(row, "view")}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleOpenTaxDrawer(row, "edit")}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400"
              title="Edit Tax"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => deleteTaxDisclosure.onOpen(row)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
              title="Delete Tax"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [toggleTaxMutation, deleteTaxDisclosure]
  )

  // ==========================================
  // 2. API & SYSTEM KEYS SECTION
  // ==========================================
  const [unmaskedKeys, setUnmaskedKeys] = useState<Record<string, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [editedKeys, setEditedKeys] = useState<Record<string, string>>({})

  const { data: settingsData } = useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => settingService.getSettings(true),
  })

  // Synchronize incoming settings with local state
  useEffect(() => {
    if (settingsData?.settings) {
      const initialMap: Record<string, string> = {}
      for (const [k, v] of Object.entries(settingsData.settings)) {
        initialMap[k] = v.value || ""
      }
      setEditedKeys(initialMap)
    }
  }, [settingsData])

  const updateSettingsMutation = useMutation({
    mutationFn: (values: Record<string, string>) =>
      settingService.updateSettings(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
      toast.success("System configurations & API keys saved successfully")
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save settings")
    },
  })

  const toggleKeyMask = (keyName: string) => {
    setUnmaskedKeys((prev) => ({
      ...prev,
      [keyName]: !prev[keyName],
    }))
  }

  const handleCopyKey = (keyName: string, val: string) => {
    if (!val) return
    navigator.clipboard.writeText(val)
    setCopiedKey(keyName)
    toast.success("Key copied to clipboard")
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleKeyChange = (keyName: string, value: string) => {
    setEditedKeys((prev) => ({
      ...prev,
      [keyName]: value,
    }))
  }

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettingsMutation.mutate(editedKeys)
  }

  const roleStyle = user?.role
    ? ROLE_BADGE_COLORS[user.role] || {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-700 dark:text-slate-300",
      }
    : {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-700 dark:text-slate-300",
      }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            System Settings & Integrations
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure multi-tax calculation rules, third-party API gateway keys,
            dispatch parameters, and admin security.
          </p>
        </div>

        {activeTab === "taxes" && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => seedPresetsMutation.mutate()}
              disabled={seedPresetsMutation.isPending}
              className="flex items-center gap-1.5 border-slate-200 text-xs font-medium dark:border-slate-800"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Load Industry
              Presets
            </Button>
            <Button
              onClick={() => handleOpenTaxDrawer(null, "create")}
              className="flex items-center gap-1.5 bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Plus className="h-4 w-4" /> Add Tax / Surcharge
            </Button>
          </div>
        )}
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("taxes")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "taxes"
              ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
          }`}
        >
          <Percent className="h-4 w-4" />
          <span>Taxes & Surcharges</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === "taxes"
                ? "bg-white/20 text-white"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {activeTaxesCount} Active
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("keys")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "keys"
              ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>API & Gateway Keys</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "general"
              ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>General Config</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "profile"
              ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Admin Profile</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: TAXES & SURCHARGES SECTION */}
      {/* ==================================================== */}
      {activeTab === "taxes" && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Total Defined Taxes
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {taxesList.length}
                </span>
                <span className="text-xs text-slate-400">registered</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Active in Checkout
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {activeTaxesCount}
                </span>
                <span className="text-xs font-medium text-emerald-600/80">
                  live rules
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Percentage Levies (%)
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {percentageTaxesCount}
                </span>
                <span className="text-xs text-slate-400">proportional</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Fixed Fee Surcharges
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {fixedTaxesCount}
                </span>
                <span className="text-xs text-slate-400">flat amount</span>
              </div>
            </div>
          </div>

          {/* SectionCard with FilterBar & DataTable */}
          <SectionCard
            title="Applicable Taxes & Surcharges"
            description="All active taxes are calculated automatically in sequence and transparently itemized on passenger booking receipts."
            action={
              <FilterBar values={taxFilter} onChange={handleTaxFilterChange}>
                <FilterBar.Search
                  name="search"
                  placeholder="Search by tax name or code..."
                  className="w-full sm:w-[240px]"
                />
                <FilterBar.Select
                  name="taxType"
                  options={TAX_FILTER_TYPE_OPTIONS}
                  className="w-[130px]"
                />
                <FilterBar.Select
                  name="applicableOn"
                  options={TAX_FILTER_SCOPE_OPTIONS}
                  className="w-[150px]"
                />
                <FilterBar.Select
                  name="isActive"
                  options={TAX_FILTER_STATUS_OPTIONS}
                  className="w-[120px]"
                />
              </FilterBar>
            }
          >
            <div className="mt-4">
              <DataTable
                columns={taxColumns}
                data={taxesList}
                isLoading={isLoadingTaxes}
                searchPlaceholder="Filter taxes table..."
              />
            </div>
          </SectionCard>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: API & GATEWAY KEYS SECTION */}
      {/* ==================================================== */}
      {activeTab === "keys" && (
        <form onSubmit={handleSaveKeys} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Third-Party API Credentials & Secrets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure live integration keys for navigation, payment
                transactions, OTP dispatches, and cloud storage.
              </p>
            </div>
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="flex items-center gap-2 bg-indigo-600 px-5 text-xs font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Saving Keys...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save All Keys
                </>
              )}
            </Button>
          </div>

          {/* Group 1: Google Maps & Routing */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Maps, Geocoding & Turn-by-Turn Navigation
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Required for passenger address autocomplete, route distance
                  matrices, and driver tracking.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Google Maps API Key */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    Google Maps API Key
                  </label>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      editedKeys["GOOGLE_MAPS_API_KEY"]
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    }`}
                  >
                    {editedKeys["GOOGLE_MAPS_API_KEY"]
                      ? "Configured"
                      : "Not Set"}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={
                      unmaskedKeys["GOOGLE_MAPS_API_KEY"] ? "text" : "password"
                    }
                    value={editedKeys["GOOGLE_MAPS_API_KEY"] || ""}
                    onChange={(e) =>
                      handleKeyChange("GOOGLE_MAPS_API_KEY", e.target.value)
                    }
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-20 pl-3.5 font-mono text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                  <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleKeyMask("GOOGLE_MAPS_API_KEY")}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {unmaskedKeys["GOOGLE_MAPS_API_KEY"] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyKey(
                          "GOOGLE_MAPS_API_KEY",
                          editedKeys["GOOGLE_MAPS_API_KEY"] || ""
                        )
                      }
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {copiedKey === "GOOGLE_MAPS_API_KEY" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Enables Places SDK, Geocoding, and Directions API for ride
                  route planning.
                </p>
              </div>

              {/* Mapbox Token */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    Mapbox Navigation Access Token
                  </label>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      editedKeys["MAPBOX_ACCESS_TOKEN"]
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    }`}
                  >
                    {editedKeys["MAPBOX_ACCESS_TOKEN"]
                      ? "Configured"
                      : "Not Set"}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={
                      unmaskedKeys["MAPBOX_ACCESS_TOKEN"] ? "text" : "password"
                    }
                    value={editedKeys["MAPBOX_ACCESS_TOKEN"] || ""}
                    onChange={(e) =>
                      handleKeyChange("MAPBOX_ACCESS_TOKEN", e.target.value)
                    }
                    placeholder="pk.eyJ1..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-20 pl-3.5 font-mono text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                  <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleKeyMask("MAPBOX_ACCESS_TOKEN")}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {unmaskedKeys["MAPBOX_ACCESS_TOKEN"] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyKey(
                          "MAPBOX_ACCESS_TOKEN",
                          editedKeys["MAPBOX_ACCESS_TOKEN"] || ""
                        )
                      }
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {copiedKey === "MAPBOX_ACCESS_TOKEN" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Powers driver turn-by-turn interactive voice and waypoint
                  vector tiles.
                </p>
              </div>
            </div>
          </div>

          {/* Group 2: Payment Gateways */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Payment Gateways (Razorpay)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Process UPI, credit/debit cards, and mobile wallets with
                  automated driver payouts.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Razorpay Key ID */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Razorpay Key ID
                </label>
                <input
                  type="text"
                  value={editedKeys["RAZORPAY_KEY_ID"] || ""}
                  onChange={(e) =>
                    handleKeyChange("RAZORPAY_KEY_ID", e.target.value)
                  }
                  placeholder="rzp_live_..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 font-mono text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                />
              </div>

              {/* Razorpay Secret */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Razorpay Key Secret
                </label>
                <div className="relative">
                  <input
                    type={
                      unmaskedKeys["RAZORPAY_KEY_SECRET"] ? "text" : "password"
                    }
                    value={editedKeys["RAZORPAY_KEY_SECRET"] || ""}
                    onChange={(e) =>
                      handleKeyChange("RAZORPAY_KEY_SECRET", e.target.value)
                    }
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-12 pl-3.5 font-mono text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyMask("RAZORPAY_KEY_SECRET")}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {unmaskedKeys["RAZORPAY_KEY_SECRET"] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Group 4: Cloud Media Storage */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Cloud Object Storage (AWS S3 / Cloudflare R2)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Secure storage bucket for driver driving licenses, vehicle RC
                  permits, and car photos.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  S3 Bucket Name
                </label>
                <input
                  type="text"
                  value={editedKeys["S3_BUCKET_NAME"] || ""}
                  onChange={(e) =>
                    handleKeyChange("S3_BUCKET_NAME", e.target.value)
                  }
                  placeholder="cab-booking-storage"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  AWS Region
                </label>
                <input
                  type="text"
                  value={editedKeys["S3_REGION"] || ""}
                  onChange={(e) => handleKeyChange("S3_REGION", e.target.value)}
                  placeholder="ap-south-1"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Access Key ID
                </label>
                <input
                  type="text"
                  value={editedKeys["S3_ACCESS_KEY"] || ""}
                  onChange={(e) =>
                    handleKeyChange("S3_ACCESS_KEY", e.target.value)
                  }
                  placeholder="AKIA..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 font-mono text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Secret Access Key
                </label>
                <div className="relative">
                  <input
                    type={unmaskedKeys["S3_SECRET_KEY"] ? "text" : "password"}
                    value={editedKeys["S3_SECRET_KEY"] || ""}
                    onChange={(e) =>
                      handleKeyChange("S3_SECRET_KEY", e.target.value)
                    }
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-12 pl-3.5 font-mono text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyMask("S3_SECRET_KEY")}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {unmaskedKeys["S3_SECRET_KEY"] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* TAB 3: GENERAL SYSTEM CONFIGURATION SECTION */}
      {/* ==================================================== */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveKeys} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                General Booking Rules & Operational Defaults
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Control currency display, platform base fee, auto-dispatch
                proximity radius, and support helplines.
              </p>
            </div>
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="flex items-center gap-2 bg-indigo-600 px-5 text-xs font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save System Rules
                </>
              )}
            </Button>
          </div>

          <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Admin Commission & Prepaid Advance Setting Card */}
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 dark:border-amber-500/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                      <Percent className="h-4 w-4" />
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Admin Commission & Prepaid Booking Advance
                    </h4>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                      Active Booking Logic
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
                    Users pay only this percentage amount as upfront prepaid booking advance before ride confirmation. The remaining balance ({100 - (Number(editedKeys["ADMIN_COMMISSION_PERCENTAGE"]) || 20)}%) is paid to the driver after ride completion.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-36">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={editedKeys["ADMIN_COMMISSION_PERCENTAGE"] ?? "20"}
                      onChange={(e) =>
                        handleKeyChange("ADMIN_COMMISSION_PERCENTAGE", e.target.value)
                      }
                      placeholder="20"
                      className="w-full rounded-xl border border-amber-400 bg-white py-2.5 pr-8 pl-3.5 text-sm font-bold text-slate-900 transition outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-amber-500/40 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm font-bold text-amber-600 dark:text-amber-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic split explanation example */}
              <div className="mt-3.5 flex flex-wrap items-center gap-3 pt-3 border-t border-amber-500/20 text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Example on ₹1,000 Fare:</span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Prepaid Now: ₹{((1000 * (Number(editedKeys["ADMIN_COMMISSION_PERCENTAGE"]) || 20)) / 100).toFixed(0)} ({Number(editedKeys["ADMIN_COMMISSION_PERCENTAGE"]) || 20}%)
                </span>
                <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Balance on Drop: ₹{(1000 - (1000 * (Number(editedKeys["ADMIN_COMMISSION_PERCENTAGE"]) || 20)) / 100).toFixed(0)} ({100 - (Number(editedKeys["ADMIN_COMMISSION_PERCENTAGE"]) || 20)}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Primary Platform Currency
                </label>
                <select
                  value={editedKeys["PLATFORM_CURRENCY"] || "INR"}
                  onChange={(e) =>
                    handleKeyChange("PLATFORM_CURRENCY", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="AED">AED (د.إ) - UAE Dirham</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Default currency formatted across checkout, driver earnings,
                  and tax bills.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Platform Facilitation Fee
                </label>
                <div className="relative">
                  <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={editedKeys["PLATFORM_BASE_FEE"] || "49"}
                    onChange={(e) =>
                      handleKeyChange("PLATFORM_BASE_FEE", e.target.value)
                    }
                    placeholder="49"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-3.5 pl-8 text-xs font-semibold text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Platform convenience commission fee retained per completed
                  booking.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Auto-Dispatch Proximity Radius
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={editedKeys["AUTO_DISPATCH_RADIUS_KM"] || "5"}
                    onChange={(e) =>
                      handleKeyChange("AUTO_DISPATCH_RADIUS_KM", e.target.value)
                    }
                    placeholder="5"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3.5 text-xs font-semibold text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                  <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-medium text-slate-400">
                    km
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Maximum geo-distance to poll active available drivers for
                  instant pickup.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Driver Accept Timeout
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={editedKeys["DRIVER_ACCEPT_TIMEOUT_SEC"] || "45"}
                    onChange={(e) =>
                      handleKeyChange(
                        "DRIVER_ACCEPT_TIMEOUT_SEC",
                        e.target.value
                      )
                    }
                    placeholder="45"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-14 pl-3.5 text-xs font-semibold text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                  <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-medium text-slate-400">
                    seconds
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Time window before re-routing trip to next nearest driver.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Cancellation Grace Period
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={editedKeys["RIDE_CANCEL_GRACE_MINUTES"] || "5"}
                    onChange={(e) =>
                      handleKeyChange(
                        "RIDE_CANCEL_GRACE_MINUTES",
                        e.target.value
                      )
                    }
                    placeholder="5"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-14 pl-3.5 text-xs font-semibold text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                  <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-medium text-slate-400">
                    minutes
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Window for free passenger cancellation without fee penalty.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Emergency Police SOS Number
                </label>
                <input
                  type="text"
                  value={editedKeys["EMERGENCY_SOS_PHONE"] || "112"}
                  onChange={(e) =>
                    handleKeyChange("EMERGENCY_SOS_PHONE", e.target.value)
                  }
                  placeholder="112"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Emergency helpline dialed when passenger triggers in-ride SOS
                  alert.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Customer Support Email
                </label>
                <input
                  type="email"
                  value={
                    editedKeys["SUPPORT_EMAIL"] || "support@cabbooking.com"
                  }
                  onChange={(e) =>
                    handleKeyChange("SUPPORT_EMAIL", e.target.value)
                  }
                  placeholder="support@cabbooking.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* TAB 4: ACCOUNT PROFILE & CREDENTIALS SECTION */}
      {/* ==================================================== */}
      {activeTab === "profile" && (
        <div className="max-w-4xl space-y-6">
          {profileMessage && (
            <div
              className={`flex items-center gap-3 rounded-xl border p-4 text-xs font-medium ${
                profileMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              }`}
            >
              {profileMessage.type === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          {/* User Profile Card Header */}
          <div className="flex flex-col gap-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <img
                src={
                  user?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || "Admin"
                  )}&background=6366f1&color=fff`
                }
                alt={user?.name || "User"}
                className="h-16 w-16 rounded-full border-2 border-indigo-500/40 object-cover shadow-md"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {user?.name || "Admin User"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.email}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${roleStyle.bg} ${roleStyle.text}`}
                  >
                    <Shield className="h-3 w-3" />
                    {user?.role || "SUPER_ADMIN"}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => refreshProfile()}
              className="flex items-center gap-2 text-xs font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Sync Profile
            </Button>
          </div>

          {/* Profile Form */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <h3 className="border-b border-slate-200 pb-4 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-slate-100">
              Personal Information
            </h3>

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-9 text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-9 text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Saving
                      Changes...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Profile Details
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Permissions Breakdown */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <h3 className="border-b border-slate-200 pb-4 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-slate-100">
              Assigned Permissions & Privileges
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Active system privileges for resource operations on your account.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {user?.permissions && user.permissions.length > 0 ? (
                user.permissions.map((perm, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-300"
                  >
                    {perm}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">
                  No custom permissions listed
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tax Unified Drawer (Modal) */}
      <TaxDrawer
        open={taxDrawerDisclosure.isOpen}
        onClose={taxDrawerDisclosure.onClose}
        tax={taxDrawerDisclosure.data}
      />

      {/* Tax Deletion Confirmation Dialog */}
      <ConfirmDialog
        open={deleteTaxDisclosure.isOpen}
        onOpenChange={deleteTaxDisclosure.onClose}
        title="Delete Tax Definition"
        description={`Are you sure you want to permanently delete tax "${deleteTaxDisclosure.data?.name}" (${deleteTaxDisclosure.data?.code})? This will stop calculating this tax on upcoming bookings.`}
        confirmText="Yes, Delete Tax"
        variant="danger"
        isLoading={deleteTaxMutation.isPending}
        onConfirm={() => {
          if (deleteTaxDisclosure.data?.id) {
            deleteTaxMutation.mutate(deleteTaxDisclosure.data.id)
          }
        }}
      />
    </div>
  )
}

export default SettingsPage
