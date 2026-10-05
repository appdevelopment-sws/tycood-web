import { useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Ticket, Plus, Eye, XCircle } from "lucide-react"
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
import type { Booking } from "@/types/bus"
import BookingDialog from "@/components/dialog/BookingDialog"

const INITIAL_BOOKING_FILTERS = {
  search: "",
  status: "",
  page: 1,
  limit: 10,
}

export const BookingsPage = () => {
  const queryClient = useQueryClient()

  const dialogDisclosure = useDisclosure<any>()
  const cancelDisclosure = useDisclosure<any>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_BOOKING_FILTERS)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.bookings.list(filter),
    queryFn: () => bookingService.getBookings(filter),
  })

  const bookingsList = data?.data || []

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingService.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all })
      cancelDisclosure.onClose()
      toast.success("Booking cancelled and seats released successfully")
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
        header: "Ticket / PNR",
        accessorKey: "ticketNumber",
        cell: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Ticket className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono font-bold text-indigo-400">
                {row.pnr || row.ticketNumber}
              </span>
              <div className="text-[10px] text-slate-400">
                {row.bookedAt ? new Date(row.bookedAt).toLocaleDateString() : "N/A"}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Passenger Details",
        cell: (row) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {row.passengerName}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {row.passengerEmail || row.passengerPhone || "—"}
            </div>
          </div>
        ),
      },
      {
        header: "Route & Operator",
        accessorKey: "routeName",
        cell: (row) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {row.routeName}
            </div>
            <div className="text-[11px] text-slate-400">
              {row.operatorName || "Express Travels"} • {row.busCategory || "AC Sleeper"}
            </div>
          </div>
        ),
      },
      {
        header: "Seats",
        cell: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.seatNumbers && row.seatNumbers.length > 0 ? (
              row.seatNumbers.map((seat) => (
                <span
                  key={seat}
                  className="rounded border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-400"
                >
                  {seat}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">N/A</span>
            )}
          </div>
        ),
      },
      {
        header: "Payment",
        cell: (row) => {
          const advance =
            row.advanceAmount !== undefined
              ? row.advanceAmount
              : (row.totalAmount || 0) * 0.2;
          const remaining =
            row.remainingAmount !== undefined
              ? row.remainingAmount
              : Math.max(0, (row.totalAmount || 0) - advance);
          const isFullyPaid = row.paymentStatus === "COMPLETED" || remaining <= 0;

          return (
            <div>
              <div className="font-bold text-emerald-400">
                ₹{(row.totalAmount || 0).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">
                <span className="text-emerald-400 font-medium">Adv: ₹{advance.toFixed(0)}</span>
                {!isFullyPaid && (
                  <span className="text-amber-400 ml-1.5 font-medium">Bal: ₹{remaining.toFixed(0)}</span>
                )}
              </div>
              <div className="text-[10px] text-indigo-400 uppercase font-semibold">
                {row.paymentMethod || "CARD"} ({row.paymentStatus || (isFullyPaid ? "COMPLETED" : "ADVANCE_PAID")})
              </div>
            </div>
          );
        },
      },
      {
        header: "Status",
        cell: (row) => <StatusBadge status={row.status || "CONFIRMED"} />,
      },
      {
        header: "Actions",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpen(row, "view")}
              className="h-7 px-2 text-[10px] gap-1"
            >
              <Eye className="h-3 w-3" /> Details
            </Button>

            {row.status !== "CANCELLED" && (
              <PermissionGate resource="bookings" action="delete">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenCancel(row)}
                  className="h-7 px-2 text-[10px] text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
                >
                  <XCircle className="h-3 w-3 mr-1" /> Cancel
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
            Bookings & Reservations
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Search reservation tickets, issue counter bookings, view passenger seat manifests, and manage cancellations.
          </p>
        </div>

        <PermissionGate resource="bookings" action="create">
          <Button onClick={() => handleOpen(null, "create")} className="gap-2">
            <Plus className="h-4 w-4" /> Issue New Booking
          </Button>
        </PermissionGate>
      </div>

      <SectionCard
        title="Passenger Reservations Manifest"
        description="Filter and search all passenger bookings across operators, routes, and trips."
      >
        <FilterBar values={filter} onChange={handleFilterChange}>
          <FilterBar.Search
            name="search"
            placeholder="Search ticket #, PNR, passenger name, or email..."
            className="w-72"
          />
          <FilterBar.Select
            name="status"
            placeholder="All Statuses"
            options={[
              { label: "Confirmed", value: "CONFIRMED" },
              { label: "Cancelled", value: "CANCELLED" },
              { label: "Pending", value: "PENDING" },
              { label: "Completed", value: "COMPLETED" },
            ]}
          />
        </FilterBar>

        <div className="mt-4">
          <DataTable
            title="Master Passenger Bookings"
            columns={columns}
            data={bookingsList}
            isLoading={isLoading}
          />
        </div>
      </SectionCard>

      {/* Booking Dialog Modal Drawer */}
      <BookingDialog
        open={dialogDisclosure.isOpen}
        onClose={dialogDisclosure.onClose}
        booking={dialogDisclosure.data}
      />

      {/* Confirm Cancellation Dialog */}
      <ConfirmDialog
        open={cancelDisclosure.isOpen}
        onOpenChange={cancelDisclosure.onClose}
        title="Cancel Reservation Ticket"
        description={`Are you sure you want to cancel booking ticket ${cancelDisclosure.data?.pnr || cancelDisclosure.data?.ticketNumber}? This will release the reserved seats back to available status.`}
        onConfirm={() => {
          if (cancelDisclosure.data?.id) {
            cancelMutation.mutate(cancelDisclosure.data.id)
          }
        }}
        isLoading={cancelMutation.isPending}
        confirmText="Cancel Booking"
        variant="danger"
      />
    </div>
  )
}

export default BookingsPage
