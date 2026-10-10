import { useCallback, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  SquareParking,
  CheckCircle2,
  XCircle,
  Eye,
  Percent,
  Receipt,
  ShieldCheck,
  Building2,
  PowerOff,
  Power,
  Trash2,
  Ban,
} from "lucide-react"
import { Link } from "react-router-dom"
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
  type ParkingBookingAdminItem,
} from "@/services/parkingAdminService"
import { settingService } from "@/services/settingService"
import ParkingDrawer from "@/components/dialog/ParkingDrawer"

type ParkingTab = "operators" | "bookings"

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
  const deleteDisclosure = useDisclosure<ParkingOperatorItem>()
  const disableDisclosure = useDisclosure<ParkingOperatorItem>()
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

  // 2. System Settings (for unified parking commission display)
  const { data: systemSettingsResponse } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingService.getSettings(),
  })
  const parkingCommissionSetting =
    systemSettingsResponse?.settings?.["PARKING_COMMISSION_PERCENTAGE"]
  const parkingCommissionPercentage =
    typeof parkingCommissionSetting === "object"
      ? parkingCommissionSetting?.value || "20"
      : String(parkingCommissionSetting || "20")

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

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => parkingAdminService.toggleOperatorStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-operators"] })
      disableDisclosure.onClose()
      toast.success("Parking operator status toggled successfully!")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to toggle operator status")
    },
  })

  const deleteOperatorMutation = useMutation({
    mutationFn: (id: string) => parkingAdminService.deleteOperator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-operators"] })
      deleteDisclosure.onClose()
      drawerDisclosure.onClose()
      toast.success("Parking facility and associated data permanently removed.")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete parking facility")
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
        header: "Status",
        cell: (row) => (
          <StatusBadge status={row.verificationStatus || "PENDING"} />
        ),
      },
      {
        header: "Actions",
        className: "text-right",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            {row.verificationStatus === "PENDING" && (
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
            )}

            {row.verificationStatus === "VERIFIED" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/40 px-2 text-xs font-medium"
                onClick={() => disableDisclosure.onOpen(row)}
                title="Disable facility"
              >
                <PowerOff className="h-3.5 w-3.5" />
                Disable
              </Button>
            )}

            {row.verificationStatus === "SUSPENDED" && (
              <Button
                size="sm"
                className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 text-xs font-semibold shadow-xs"
                onClick={() => toggleStatusMutation.mutate(row.id)}
                disabled={toggleStatusMutation.isPending}
                title="Enable facility"
              >
                <Power className="h-3.5 w-3.5" />
                Enable
              </Button>
            )}

            {/* Remove / Delete Action */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
              onClick={() => deleteDisclosure.onOpen(row)}
              title="Delete facility permanently"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            {/* View Details Drawer */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              onClick={() => handleOpen(row)}
              title="View facility details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ]
  }, [
    verifyMutation,
    rejectDisclosure,
    disableDisclosure,
    deleteDisclosure,
    toggleStatusMutation,
  ])

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
      {/* Drawer */}
      <ParkingDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        operator={drawerDisclosure.data}
        onVerify={(id) => verifyMutation.mutate(id)}
        isVerifying={verifyMutation.isPending}
        onToggleStatus={(id) => toggleStatusMutation.mutate(id)}
        isTogglingStatus={toggleStatusMutation.isPending}
        onDelete={(op) => deleteDisclosure.onOpen(op)}
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

      {/* Disable Confirmation */}
      <ConfirmDialog
        open={disableDisclosure.isOpen}
        onOpenChange={disableDisclosure.onClose}
        title="Disable Parking Facility"
        description={`Are you sure you want to disable "${disableDisclosure.data?.facilityName}"? Users will temporarily no longer be able to find or book slots at this facility.`}
        onConfirm={() => {
          if (disableDisclosure.data?.id) {
            toggleStatusMutation.mutate(disableDisclosure.data.id)
          }
        }}
        isLoading={toggleStatusMutation.isPending}
        confirmText="Disable Facility"
        variant="danger"
      />

      {/* Delete / Remove Confirmation */}
      <ConfirmDialog
        open={deleteDisclosure.isOpen}
        onOpenChange={deleteDisclosure.onClose}
        title="Permanently Delete Parking Facility"
        description={`Are you sure you want to permanently delete "${deleteDisclosure.data?.facilityName}" (${deleteDisclosure.data?.ownerName})? All associated bays, floors, and location records will be removed.`}
        onConfirm={() => {
          if (deleteDisclosure.data?.id) {
            deleteOperatorMutation.mutate(deleteDisclosure.data.id)
          }
        }}
        isLoading={deleteOperatorMutation.isPending}
        confirmText="Delete Facility"
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
            <Ban className="h-3.5 w-3.5 text-rose-500" />
            Disabled / Suspended
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {operators.filter((o) => o.verificationStatus === "SUSPENDED").length}
            </span>
            <span className="text-xs text-slate-400">inactive facilities</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Percent className="h-3.5 w-3.5 text-indigo-500" />
              Platform Commission
            </div>
            <Link
              to="/admin/settings"
              className="text-[10px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Edit in Settings →
            </Link>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {parkingCommissionPercentage}%
            </span>
            <span className="text-xs text-slate-400">prepaid advance & cut</span>
          </div>
        </div>
      </div>

      {/* Clean Tab Navigation - Unwanted settings removed */}
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
          description="Verify, enable, disable, and manage commercial parking operators and digital parking facilities"
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
                  { label: "Disabled / Suspended", value: "SUSPENDED" },
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
      {/* TAB 2: GLOBAL BOOKINGS LEDGER */}
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
