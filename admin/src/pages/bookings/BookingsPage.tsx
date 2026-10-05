import { useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Car, Plus, Eye, XCircle, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/common/DataTable"
import type { Column } from "@/components/common/DataTable"
import { FilterBar } from "@/components/filter-bar"
import SectionCard from "@/components/SectionCard"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirmDialog"
import { PermissionGate } from "@/components/common/PermissionGate"
import { StatusBadge } from "@/components/common/StatusBadge"
import { useDisclosure } from "@/hooks/useDisclosure"
import useSearchFilter from "@/hooks/useSearchFilter"

import { bookingService } from "@/services/bookingService"
import { queryKeys } from "@/lib/queryKeys"
import type { Booking } from "@/types/booking"
import BookingDialog from "@/components/dialog/BookingDialog"

const INITIAL_BOOKING_FILTERS = {
  search: "",
  status: "",
  serviceType: "",
  page: 1,
  limit: 10,
}

export const BookingsPage = () => {
  const queryClient = useQueryClient()

  const dialogDisclosure = useDisclosure<any>()
  const cancelDisclosure = useDisclosure<any>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_BOOKING_FILTERS)

  const { data: bookingsResponse, isLoading } = useQuery({
    queryKey: queryKeys.bookings.list(filter),
    queryFn: () => bookingService.getBookings(filter),
  })

  const bookingsList: Booking[] =
    bookingsResponse?.data || (Array.isArray(bookingsResponse) ? bookingsResponse : [])

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      bookingService.cancelBooking(id, "Cancelled by platform administrator"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
      cancelDisclosure.onClose()
      toast.success("Ride booking cancelled successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel booking")
    },
  })

  const handleOpen = (
    booking: Booking | null = null,
    mode: "create" | "view" = "create"
  ) => {
    dialogDisclosure.onOpen(
      booking ? { ...booking, viewMode: mode === "view" } : null
    )
  }

  const handleOpenCancel = (booking: Booking) => {
    cancelDisclosure.onOpen(booking)
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter({ ...updates, page: 1 })
    },
    [handleFilter]
  )

  const columns: Column<Booking>[] = useMemo(
    () => [
      {
        header: "Ride / Booking #",
        accessorKey: "bookingNumber",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {row.bookingNumber || `#CAB-${row.id?.slice(0, 8)}`}
                </span>
                <span className="rounded bg-indigo-500/15 px-1.5 py-0.2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  {row.serviceType || "CAB"}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {row.scheduledDateTime
                  ? new Date(row.scheduledDateTime).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Scheduled"}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Passenger",
        cell: (row) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {row.passengerName || row.user?.name || "Passenger"}
            </div>
            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {row.passengerPhone || row.user?.phone || "—"}
            </div>
          </div>
        ),
      },
      {
        header: "Trip Route",
        cell: (row) => (
          <div className="max-w-[220px]">
            <div className="flex items-center gap-1 text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate">{row.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
              <span className="truncate">
                {row.dropLocation || "Hourly / As Directed"}
              </span>
            </div>
            <div className="mt-0.5">
              <span className="inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {(row.tripType || "ONE_WAY").replace("_", " ")}
              </span>
            </div>
          </div>
        ),
      },
      {
        header: "Cab & Driver",
        cell: (row) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {row.cabName || "Cab Vehicle"} •{" "}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {row.cabCategory || "Sedan"}
              </span>
            </div>
            <div className="font-mono text-[11px] text-indigo-500 dark:text-indigo-400">
              {row.cabPlateNumber || "Plate Unassigned"}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              Driver: {row.driverName || "Pending Dispatch"}
            </div>
          </div>
        ),
      },
      {
        header: "Fare & Payment",
        cell: (row) => {
          const total = Number(row.totalAmount || 0)
          const advance = Number(row.advanceAmount || 0)
          const remaining = Number(
            row.remainingAmount !== undefined
              ? row.remainingAmount
              : Math.max(0, total - advance)
          )
          const isFullyPaid =
            row.paymentStatus === "COMPLETED" || remaining <= 0

          return (
            <div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                ₹{total.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Adv: ₹{advance.toFixed(0)}
                </span>
                {!isFullyPaid && (
                  <span className="ml-1.5 font-medium text-amber-600 dark:text-amber-400">
                    Bal: ₹{remaining.toFixed(0)}
                  </span>
                )}
              </div>
              <div className="text-[10px] font-semibold uppercase text-indigo-500 dark:text-indigo-400">
                {row.paymentMethod || "UPI"} ({row.paymentStatus || (isFullyPaid ? "COMPLETED" : "ADVANCE_PAID")})
              </div>
            </div>
          )
        },
      },
      {
        header: "Status & PIN",
        cell: (row) => (
          <div className="space-y-1">
            <StatusBadge status={row.status || "ACTIVE"} />
            {row.otp && row.status !== "CANCELLED" && (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                <ShieldCheck className="h-3 w-3" /> PIN: {row.otp}
              </div>
            )}
          </div>
        ),
      },
      {
        header: "Actions",
        className: "text-right",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpen(row, "view")}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <Eye className="h-3.5 w-3.5" /> Details
            </Button>

            {row.status !== "CANCELLED" && row.status !== "COMPLETED" && (
              <PermissionGate resource="bookings" action="delete">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenCancel(row)}
                  className="h-8 px-2.5 text-xs text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 border-rose-500/30"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
              </PermissionGate>
            )}
          </div>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Cab Bookings & Ride Dispatch
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Monitor real-time passenger reservations, dispatched fleet cabs, routes, fare collections, and trip lifecycle.
          </p>
        </div>

        <PermissionGate resource="bookings" action="create">
          <Button onClick={() => handleOpen(null, "create")} className="gap-2">
            <Plus className="h-4 w-4" /> Issue New Booking
          </Button>
        </PermissionGate>
      </div>

      <SectionCard
        title="Ride Bookings Manifest"
        description="Search and filter ride bookings across fleet categories, service types, and status."
      >
        <FilterBar values={filter} onChange={handleFilterChange}>
          <FilterBar.Search
            name="search"
            placeholder="Search booking #, passenger, pickup, drop..."
            className="w-72"
          />
          <FilterBar.Select
            name="serviceType"
            placeholder="All Services"
            options={[
              { label: "All Services", value: "" },
              { label: "Cab Booking", value: "CAB" },
              { label: "Parking", value: "PARKING" },
              { label: "Rental", value: "RENTAL" },
              { label: "Technician", value: "TECHNICIAN" },
            ]}
          />
          <FilterBar.Select
            name="status"
            placeholder="All Statuses"
            options={[
              { label: "All Statuses", value: "" },
              { label: "Active", value: "ACTIVE" },
              { label: "Upcoming", value: "UPCOMING" },
              { label: "Completed", value: "COMPLETED" },
              { label: "Cancelled", value: "CANCELLED" },
            ]}
          />
        </FilterBar>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={bookingsList}
            isLoading={isLoading}
          />
        </div>
      </SectionCard>

      {/* Booking Details / Create Modal Drawer */}
      <BookingDialog
        open={dialogDisclosure.isOpen}
        onClose={dialogDisclosure.onClose}
        booking={dialogDisclosure.data}
      />

      {/* Confirm Ride Cancellation Dialog */}
      <ConfirmDialog
        open={cancelDisclosure.isOpen}
        onOpenChange={cancelDisclosure.onClose}
        title="Cancel Ride Booking"
        description={`Are you sure you want to cancel booking "${cancelDisclosure.data?.bookingNumber || cancelDisclosure.data?.id}"? The passenger and assigned driver will be notified.`}
        onConfirm={() => {
          if (cancelDisclosure.data?.id) {
            cancelMutation.mutate(cancelDisclosure.data.id)
          }
        }}
        isLoading={cancelMutation.isPending}
        confirmText="Cancel Ride"
        variant="danger"
      />
    </div>
  )
}

export default BookingsPage
