import { useCallback, useMemo, useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  SquareParking,
  CheckCircle2,
  XCircle,
  Eye,
  Percent,
  Receipt,
  Save,
  ShieldCheck,
  Building2,
  Coins,
  ArrowRightLeft,
} from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/common/DataTable"
import type { Column } from "@/components/common/DataTable"
import { FilterBar } from "@/components/filter-bar"
import SectionCard from "@/components/SectionCard"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirmDialog"
import { useDisclosure } from "@/hooks/useDisclosure"
import useSearchFilter from "@/hooks/useSearchFilter"
import { StatusBadge } from "@/components/common/StatusBadge"

import {
  parkingAdminService,
  type ParkingOperatorItem,
  type ParkingSettings,
  type ParkingBookingAdminItem,
} from "@/services/parkingAdminService"
import ParkingDrawer from "@/components/dialog/ParkingDrawer"

type ParkingTab = "operators" | "settings" | "bookings"

const INITIAL_PARKING_FILTERS = {
  search: "",
  verificationStatus: "",
}

const INITIAL_BOOKING_FILTERS = {
  search: "",
  status: "",
}

export const ParkingPage = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<ParkingTab>("operators")

  const drawerDisclosure = useDisclosure<ParkingOperatorItem>()
  const rejectDisclosure = useDisclosure<ParkingOperatorItem>()
  const [rejectReason, setRejectReason] = useState("")

  const { filter, handleFilter } = useSearchFilter(INITIAL_PARKING_FILTERS)
  const { filter: bookingFilter, handleFilter: handleBookingFilter } =
    useSearchFilter(INITIAL_BOOKING_FILTERS)

  // 1. Operators Query
  const { data: operators = [], isLoading: isLoadingOperators } = useQuery({
    queryKey: ["parking-operators", filter],
    queryFn: async () => {
      return parkingAdminService.getOperators({
        search: filter.search || undefined,
        verificationStatus: filter.verificationStatus || undefined,
      })
    },
  })

  // 2. Settings Query
  const { data: parkingSettings, isLoading: isLoadingSettings } = useQuery<ParkingSettings>({
    queryKey: ["parking-admin-settings"],
    queryFn: () => parkingAdminService.getParkingSettings(),
  })

  // Settings local edit form state
  const [settingsForm, setSettingsForm] = useState<Partial<ParkingSettings>>({
    enabled: true,
    commissionType: "PERCENTAGE",
    commissionValue: 15,
    advancePaymentType: "PERCENTAGE",
    advancePaymentValue: 25,
    minAdvanceAmount: 20,
    maxAdvanceAmount: 500,
    cancellationWindowHours: 1,
    refundDeductionPercentage: 10,
    gracePeriodMinutes: 15,
    overtimeHourlyRateMultiplier: 1.25,
  })

  useEffect(() => {
    if (parkingSettings) {
      setSettingsForm(parkingSettings)
    }
  }, [parkingSettings])

  // 3. Bookings Ledger Query
  const { data: bookingsResponse, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["parking-admin-bookings", bookingFilter],
    queryFn: () =>
      parkingAdminService.getAdminBookings({
        search: bookingFilter.search || undefined,
        status: bookingFilter.status || undefined,
        limit: 50,
      }),
  })
  const bookingsList = bookingsResponse?.data || []

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: (id: string) => parkingAdminService.verifyOperator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-operators"] })
      drawerDisclosure.onClose()
      toast.success("Parking operator verified and facilities activated successfully!")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to verify parking operator")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      parkingAdminService.rejectOperator(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-operators"] })
      rejectDisclosure.onClose()
      setRejectReason("")
      toast.success("Parking operator application rejected")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject parking operator")
    },
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<ParkingSettings>) =>
      parkingAdminService.updateParkingSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-admin-settings"] })
      toast.success("Parking commission and advance payment settings updated successfully!")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update settings")
    },
  })

  const handleOpen = (operator: ParkingOperatorItem | null = null) => {
    drawerDisclosure.onOpen(operator ? { ...operator, viewMode: true } : null)
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter(updates)
    },
    [handleFilter]
  )

  const handleBookingFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleBookingFilter(updates)
    },
    [handleBookingFilter]
  )

  // Columns for Operators
  const operatorColumns: Column<ParkingOperatorItem>[] = useMemo(() => {
    return [
      {
        header: "Facility & Owner",
        accessorKey: "facilityName",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 font-bold text-blue-600">
              <SquareParking className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {row.facilityName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Owner: {row.ownerName}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Contact Details",
        cell: (row) => (
          <div>
            <div className="font-mono text-xs text-slate-800 dark:text-slate-200">
              {row.businessPhone}
            </div>
            {row.businessEmail && row.businessEmail !== "—" && (
              <div className="text-[11px] text-slate-500">{row.businessEmail}</div>
            )}
          </div>
        ),
      },
      {
        header: "Location & City",
        cell: (row) => {
          const loc = row.locations && row.locations.length > 0 ? row.locations[0] : null
          return (
            <div>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {loc ? loc.city : "Registered Site"}
              </span>
              <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                {loc ? loc.address : "Location details in review"}
              </div>
            </div>
          )
        },
      },
      {
        header: "Bay Capacity",
        cell: (row) => {
          const loc = row.locations && row.locations.length > 0 ? row.locations[0] : null
          if (!loc) return <span className="text-xs text-slate-400">—</span>
          return (
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {loc.capacity ?? (loc.carSlotsTotal + loc.bikeSlotsTotal)} Total Bays
              </span>
              <div className="text-[11px] text-slate-500">
                🚗 {loc.carSlotsTotal || 0} Cars • 🏍️ {loc.bikeSlotsTotal || 0} Bikes
              </div>
            </div>
          )
        },
      },
      {
        header: "Verification",
        cell: (row) => (
          <StatusBadge status={row.verificationStatus || "PENDING"} />
        ),
      },
      {
        header: "Actions",
        className: "text-right",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            {row.verificationStatus !== "VERIFIED" ? (
              <>
                <Button
                  size="sm"
                  className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 text-xs font-semibold shadow-xs"
                  onClick={() => verifyMutation.mutate(row.id)}
                  disabled={verifyMutation.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 border-rose-200 text-rose-600 hover:bg-rose-50 px-2 text-xs font-medium"
                  onClick={() => rejectDisclosure.onOpen(row)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified
              </span>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => handleOpen(row)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ]
  }, [verifyMutation, rejectDisclosure])

  // Columns for Bookings Ledger
  const bookingColumns: Column<ParkingBookingAdminItem>[] = useMemo(() => {
    return [
      {
        header: "Booking Pass",
        accessorKey: "bookingNumber",
        cell: (row) => (
          <div>
            <div className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
              {row.bookingNumber || row.id.substring(0, 8)}
            </div>
            <div className="text-[11px] text-slate-500">
              {row.vehicleType} • {row.durationHours} hrs
            </div>
          </div>
        ),
      },
      {
        header: "Facility & Bay",
        cell: (row) => (
          <div>
            <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
              {row.location?.name || "Smart Parking Lot"}
            </div>
            <div className="text-[11px] text-slate-500">
              {row.allocatedFloor} • {row.allocatedBay} ({row.location?.city || "City"})
            </div>
          </div>
        ),
      },
      {
        header: "Vehicle Plate",
        cell: (row) => (
          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {row.vehicleNumber}
          </span>
        ),
      },
      {
        header: "Pricing & Advance",
        cell: (row) => (
          <div className="text-xs">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              Total: ₹{row.totalAmount}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              Advance Paid: ₹{row.advanceAmount}
            </div>
            <div className="text-[11px] text-slate-500">
              Due at Exit: ₹{row.remainingAmount}
            </div>
          </div>
        ),
      },
      {
        header: "Platform Commission & Payout",
        cell: (row) => (
          <div className="text-xs">
            <div className="font-semibold text-indigo-600 dark:text-indigo-400">
              Commission: ₹{row.platformCommission}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              Operator Payout: ₹{row.operatorPayout}
            </div>
          </div>
        ),
      },
      {
        header: "Booking Status",
        cell: (row) => <StatusBadge status={row.status || "CONFIRMED"} />,
      },
      {
        header: "Payment",
        cell: (row) => (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold ${
              row.paymentStatus === "PAID"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
            }`}
          >
            {row.paymentStatus}
          </span>
        ),
      },
    ]
  }, [])

  return (
    <div className="space-y-6">
      <ParkingDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        operator={drawerDisclosure.data}
        onVerify={(id) => verifyMutation.mutate(id)}
        isVerifying={verifyMutation.isPending}
      />

      {/* Reject Confirmation */}
      <ConfirmDialog
        open={rejectDisclosure.isOpen}
        onOpenChange={rejectDisclosure.onClose}
        title="Reject Parking Operator"
        description={`Reject registration for "${rejectDisclosure.data?.facilityName}" (${rejectDisclosure.data?.ownerName})?`}
        onConfirm={() =>
          rejectMutation.mutate({
            id: rejectDisclosure.data?.id || "",
            reason: rejectReason || "Ownership proof or commercial permit could not be validated",
          })
        }
        isLoading={rejectMutation.isPending}
        confirmText="Reject Registration"
        variant="danger"
      />

      {/* Top Header Summary Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <Building2 className="h-3.5 w-3.5 text-blue-500" />
            Total Facilities
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {operators.length}
            </span>
            <span className="text-xs text-slate-400">operators registered</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Verified & Live
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {operators.filter((o) => o.verificationStatus === "VERIFIED").length}
            </span>
            <span className="text-xs text-emerald-600/80 font-medium">approved</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <Percent className="h-3.5 w-3.5 text-indigo-500" />
            Platform Commission
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {parkingSettings?.commissionType === "FIXED"
                ? `₹${parkingSettings.commissionValue}`
                : `${parkingSettings?.commissionValue ?? 15}%`}
            </span>
            <span className="text-xs text-slate-400">per booking</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <Coins className="h-3.5 w-3.5 text-amber-500" />
            Advance Deposit
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {parkingSettings?.advancePaymentType === "FIXED"
                ? `₹${parkingSettings.advancePaymentValue}`
                : `${parkingSettings?.advancePaymentValue ?? 25}%`}
            </span>
            <span className="text-xs text-slate-400">upfront hold</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("operators")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "operators"
              ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
          }`}
        >
          <SquareParking className="h-4 w-4" />
          <span>Facilities & Operators</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "settings"
              ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
          }`}
        >
          <Percent className="h-4 w-4" />
          <span>Parking Commission & Advance Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "bookings"
              ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Global Bookings Ledger</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: OPERATORS & FACILITIES */}
      {/* ==================================================== */}
      {activeTab === "operators" && (
        <SectionCard
          title="Parking Facilities & Operators"
          description="Verify commercial parking operators, approve inventory capacity, and oversee digital parking facilities"
        >
          <div className="space-y-4">
            <FilterBar
              values={{
                search: filter.search || "",
                verificationStatus: filter.verificationStatus || "",
              }}
              onChange={handleFilterChange}
            >
              <FilterBar.Search
                name="search"
                placeholder="Search by facility name, owner, or phone..."
                className="w-[300px]"
              />
              <FilterBar.Select
                name="verificationStatus"
                placeholder="All Verification States"
                options={[
                  { label: "All Verification States", value: "" },
                  { label: "Pending Verification", value: "PENDING" },
                  { label: "Verified & Active", value: "VERIFIED" },
                  { label: "Rejected", value: "REJECTED" },
                ]}
                className="w-48"
              />
            </FilterBar>

            <DataTable
              columns={operatorColumns}
              data={operators}
              isLoading={isLoadingOperators}
            />
          </div>
        </SectionCard>
      )}

      {/* ==================================================== */}
      {/* TAB 2: PARKING COMMISSION & ADVANCE SETTINGS */}
      {/* ==================================================== */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <SectionCard
              title="Parking Commission & Upfront Advance Configuration"
              description="Configure independent platform commission, advance deposit requirements, and overtime billing policies for parking reservations."
            >
              {isLoadingSettings ? (
                <div className="p-8 text-center text-sm text-slate-500">Loading settings...</div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    updateSettingsMutation.mutate(settingsForm)
                  }}
                  className="space-y-6"
                >
                  {/* Service Toggle */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        Enable Parking Booking Service
                      </div>
                      <div className="text-xs text-slate-500">
                        When disabled, users cannot search or reserve new parking spaces on the mobile apps.
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={!!settingsForm.enabled}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, enabled: e.target.checked })
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-slate-300 peer-checked:bg-blue-600 peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700"></div>
                    </label>
                  </div>

                  {/* Section 1: Platform Commission */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Percent className="h-4 w-4 text-blue-600" />
                      1. Platform Commission Settings
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Commission Calculation Type
                        </label>
                        <select
                          value={settingsForm.commissionType}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              commissionType: e.target.value as "PERCENTAGE" | "FIXED",
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                          <option value="PERCENTAGE">Percentage (%) of Total Booking Fare</option>
                          <option value="FIXED">Fixed Amount (₹) per Completed Booking</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Commission Value ({settingsForm.commissionType === "PERCENTAGE" ? "%" : "₹"})
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={settingsForm.commissionValue ?? 15}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              commissionValue: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Advance Payment Policy */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Coins className="h-4 w-4 text-amber-600" />
                      2. Advance Payment & Upfront Hold Policy
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Advance Payment Rule
                        </label>
                        <select
                          value={settingsForm.advancePaymentType}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              advancePaymentType: e.target.value as "PERCENTAGE" | "FIXED",
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                          <option value="PERCENTAGE">Percentage (%) of Estimated Fare</option>
                          <option value="FIXED">Fixed Flat Deposit (₹)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Advance Amount ({settingsForm.advancePaymentType === "PERCENTAGE" ? "%" : "₹"})
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={settingsForm.advancePaymentValue ?? 25}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              advancePaymentValue: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Minimum Advance Floor (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={settingsForm.minAdvanceAmount ?? 20}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              minAdvanceAmount: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Maximum Advance Ceiling (₹)
                        </label>
                        <input
                          type="number"
                          min="10"
                          value={settingsForm.maxAdvanceAmount ?? 500}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              maxAdvanceAmount: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Cancellation, Grace & Overtime */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-emerald-600" />
                      3. Cancellation, Grace Period & Overtime Multipliers
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Free Cancellation Window (Hours)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={settingsForm.cancellationWindowHours ?? 1}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              cancellationWindowHours: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Late Cancellation Penalty (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={settingsForm.refundDeductionPercentage ?? 10}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              refundDeductionPercentage: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Overtime Multiplier (x)
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="1"
                          value={settingsForm.overtimeHourlyRateMultiplier ?? 1.25}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              overtimeHourlyRateMultiplier: parseFloat(e.target.value) || 1.0,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button
                      type="submit"
                      disabled={updateSettingsMutation.isPending}
                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 h-9"
                    >
                      <Save className="h-4 w-4" />
                      {updateSettingsMutation.isPending ? "Saving..." : "Save Parking Settings"}
                    </Button>
                  </div>
                </form>
              )}
            </SectionCard>
          </div>

          {/* Audit Rule Explanation Card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Commission Architecture Safeguards
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-blue-600">•</span>
                  <span>
                    <strong>Strict Independence:</strong> Driver and Parking commission rules operate independently and will never cross-pollinate.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-blue-600">•</span>
                  <span>
                    <strong>Snapshot Immobility:</strong> Changes apply exclusively to future bookings. Past or active bookings retain their rate snapshot.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-blue-600">•</span>
                  <span>
                    <strong>Advance Credit Deduction:</strong> The advance amount paid by the customer is automatically subtracted from the exit balance, preventing double charges.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-blue-600">•</span>
                  <span>
                    <strong>Atomic Capacity Locking:</strong> Slot holds use row-level pessimistic locking to eliminate concurrent overbooking.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: GLOBAL BOOKINGS LEDGER */}
      {/* ==================================================== */}
      {activeTab === "bookings" && (
        <SectionCard
          title="Parking Bookings & Settlement Ledger"
          description="Auditable log of customer reservations, advance collections, exit barrier balances, platform commissions, and operator payouts."
        >
          <div className="space-y-4">
            <FilterBar
              values={{
                search: bookingFilter.search || "",
                status: bookingFilter.status || "",
              }}
              onChange={handleBookingFilterChange}
            >
              <FilterBar.Search
                name="search"
                placeholder="Search by booking #, plate, or location..."
                className="w-[300px]"
              />
              <FilterBar.Select
                name="status"
                placeholder="All Booking Statuses"
                options={[
                  { label: "All Statuses", value: "" },
                  { label: "Confirmed", value: "CONFIRMED" },
                  { label: "Checked-In", value: "CHECKED_IN" },
                  { label: "Completed", value: "COMPLETED" },
                  { label: "Cancelled", value: "CANCELLED" },
                  { label: "Pending Payment", value: "PENDING_PAYMENT" },
                ]}
                className="w-48"
              />
            </FilterBar>

            <DataTable
              columns={bookingColumns}
              data={bookingsList}
              isLoading={isLoadingBookings}
            />
          </div>
        </SectionCard>
      )}
    </div>
  )
}

export default ParkingPage
