import { useCallback, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Car,
  Plus,
  Eye,
  XCircle,
  ShieldCheck,
  Wrench,
  SquareParking,
  HelpCircle,
  MapPin,
  Clock,
} from "lucide-react"
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
import { technicianService } from "@/services/technicianService"
import { parkingAdminService } from "@/services/parkingAdminService"
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
  const [activeTab, setActiveTab] = useState<"cabs" | "technicians" | "parking">("cabs")

  const dialogDisclosure = useDisclosure<any>()
  const cancelDisclosure = useDisclosure<any>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_BOOKING_FILTERS)

  // 1. Cab & Ride Bookings Query
  const { data: bookingsResponse, isLoading: isLoadingCabs } = useQuery({
    queryKey: queryKeys.bookings.list(filter),
    queryFn: () => bookingService.getBookings(filter),
    enabled: activeTab === "cabs",
  })
  const bookingsList: Booking[] =
    bookingsResponse?.data || (Array.isArray(bookingsResponse) ? bookingsResponse : [])

  // 2. Technician Bookings Query
  const { data: techBookingsResponse, isLoading: isLoadingTech } = useQuery({
    queryKey: ["technician-bookings", filter.search, filter.status],
    queryFn: () =>
      technicianService.getBookings({
        search: filter.search || undefined,
        status: filter.status || undefined,
        limit: 100,
      }),
  })
  const techBookings: any[] = Array.isArray(techBookingsResponse)
    ? techBookingsResponse
    : techBookingsResponse?.data || []

  // 3. Parking Bookings Query
  const { data: parkingBookingsResponse, isLoading: isLoadingParking } = useQuery({
    queryKey: ["parking-admin-bookings", filter.search, filter.status],
    queryFn: () =>
      parkingAdminService.getAdminBookings({
        search: filter.search || undefined,
        status: filter.status || undefined,
        limit: 100,
      }),
  })
  const parkingBookings: any[] = parkingBookingsResponse?.data || []

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
      if (updates.serviceType === "TECHNICIAN") {
        setActiveTab("technicians")
      } else if (updates.serviceType === "PARKING") {
        setActiveTab("parking")
      } else if (updates.serviceType === "CAB") {
        setActiveTab("cabs")
      }
      handleFilter({ ...updates, page: 1 })
    },
    [handleFilter]
  )

  // Columns: Cabs
  const cabColumns: Column<Booking>[] = useMemo(
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
                  : row.createdAt
                  ? new Date(row.createdAt).toLocaleDateString()
                  : "On Demand"}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Passenger & Contact",
        accessorKey: "userId",
        cell: (row) => (
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
              {row.user?.name || row.passengerName || "Direct Passenger"}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {row.user?.phone || row.passengerPhone || "No contact"}
            </div>
          </div>
        ),
      },
      {
        header: "Pickup & Destination Route",
        cell: (row) => (
          <div className="space-y-1 text-xs max-w-xs">
            <div className="flex items-start gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
              <span className="truncate text-slate-800 dark:text-slate-200">
                {row.pickupLocation || "Pickup Point"}
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 mt-1 shrink-0" />
              <span className="truncate text-slate-600 dark:text-slate-400">
                {row.dropLocation || "Drop Location"}
              </span>
            </div>
          </div>
        ),
      },
      {
        header: "Driver & Assigned Fleet",
        cell: (row) => (
          <div className="space-y-0.5 text-xs">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {row.driverName || row.driverProfile?.user?.name || "Assigning..."}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {row.vehicle?.make ? `${row.vehicle.make} ${row.vehicle.model}` : row.cabName || "Fleet Cab"} •{" "}
              {row.vehicle?.registrationNumber || "Unassigned"}
            </div>
          </div>
        ),
      },
      {
        header: "Fare & Billing",
        accessorKey: "totalAmount",
        cell: (row) => (
          <div className="space-y-0.5 text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              ₹{Number(row.totalAmount || row.baseFare || 0).toFixed(2)}
            </div>
            <div className="text-[10px] font-semibold text-emerald-600">
              {row.paymentMethod || "CASH / UPI"} ({row.paymentStatus || "PENDING"})
            </div>
          </div>
        ),
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

  // Columns: Technicians
  const technicianColumns: Column<any>[] = useMemo(() => {
    return [
      {
        header: "Booking #",
        accessorKey: "bookingNumber",
        cell: (row) => (
          <div>
            <div className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
              {row.bookingNumber}
            </div>
            <div className="text-[11px] text-slate-500">
              {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "Just now"}
            </div>
          </div>
        ),
      },
      {
        header: "Customer & Breakdown Vehicle",
        accessorKey: "user.name",
        cell: (row) => (
          <div className="text-xs">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {row.user?.name || "Customer"}
            </div>
            <div className="text-[11px] text-slate-500">
              {row.vehicleMakeModel || row.vehicleType || "Vehicle"} •{" "}
              {row.vehiclePlateNumber || "No Plate"}
            </div>
          </div>
        ),
      },
      {
        header: "Breakdown Location",
        cell: (row) => (
          <div className="max-w-xs text-xs space-y-0.5">
            <div className="flex items-start gap-1 font-medium text-slate-800 dark:text-slate-200 truncate">
              <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span className="truncate">{row.breakdownLocation || "On-road Breakdown"}</span>
            </div>
            {row.landmark && (
              <div className="text-[11px] text-slate-500 pl-4.5">
                Near: {row.landmark}
              </div>
            )}
          </div>
        ),
      },
      {
        header: "Flow & Service",
        accessorKey: "bookingType",
        cell: (row) => {
          const isCustom = row.bookingType === "CUSTOM_INSPECTION"
          return (
            <div>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  isCustom
                    ? "border border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300"
                    : "border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                }`}
              >
                {isCustom ? (
                  <HelpCircle className="h-3 w-3" />
                ) : (
                  <Wrench className="h-3 w-3" />
                )}
                {isCustom ? "Inspection / Quote" : "Fixed Service"}
              </span>
              <div className="mt-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                {row.serviceCatalogItem?.name ||
                  row.category?.name ||
                  "Roadside Diagnostic"}
              </div>
            </div>
          )
        },
      },
      {
        header: "Assigned Mechanic",
        accessorKey: "technicianProfile.workshopName",
        cell: (row) => (
          <div className="text-xs">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {row.technicianProfile?.user?.name || "Searching..."}
            </div>
            <div className="text-[11px] text-slate-500">
              {row.technicianProfile?.workshopName || "Direct Dispatch"}
            </div>
          </div>
        ),
      },
      {
        header: "Financials (Split)",
        accessorKey: "quotedAmount",
        cell: (row) => (
          <div className="space-y-0.5 text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              Total Quote: ₹{row.quotedAmount || 0}
            </div>
            <div className="text-[10px] font-semibold text-emerald-600">
              Advance Paid: ₹{row.advanceAmount || 0} ({row.adminCommissionPercentage || 20}%)
            </div>
            <div className="text-[10px] font-semibold text-indigo-600">
              Remaining: ₹{row.remainingAmount || 0}
            </div>
          </div>
        ),
      },
      {
        header: "Status & OTP",
        cell: (row) => (
          <div>
            <StatusBadge status={row.status} />
            {(row.startOtp || row.completionOtp) && (
              <div className="mt-1 text-[10px] text-slate-500">
                Start: <span className="font-mono font-bold">{row.startOtp || "—"}</span> | End:{" "}
                <span className="font-mono font-bold">{row.completionOtp || "—"}</span>
              </div>
            )}
          </div>
        ),
      },
    ]
  }, [])

  // Columns: Parking
  const parkingColumns: Column<any>[] = useMemo(() => {
    return [
      {
        header: "Pass / Ticket #",
        accessorKey: "bookingNumber",
        cell: (row) => (
          <div>
            <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
              {row.bookingNumber || row.ticketNumber || `#PRK-${row.id?.slice(0, 6)}`}
            </div>
            <div className="text-[11px] text-slate-500">
              {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "Live"}
            </div>
          </div>
        ),
      },
      {
        header: "Customer & Vehicle",
        cell: (row) => (
          <div className="text-xs">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {row.user?.name || row.customerName || "Customer"}
            </div>
            <div className="text-[11px] text-slate-500">
              Plate: {row.vehiclePlateNumber || row.vehicleNumber || "Assigned"} •{" "}
              {row.vehicleType || "Car"}
            </div>
          </div>
        ),
      },
      {
        header: "Facility & Bay",
        cell: (row) => (
          <div className="text-xs space-y-0.5">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {row.location?.name || row.facilityName || "Parking Hub"}
            </div>
            <div className="text-[11px] text-slate-500">
              Slot: <span className="font-mono font-bold">{row.slotNumber || "Bay Auto-Assign"}</span>
            </div>
          </div>
        ),
      },
      {
        header: "Duration & Timing",
        cell: (row) => (
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>{row.durationHours ? `${row.durationHours} hrs` : "Hourly Pass"}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              In: {row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Scheduled"}
            </div>
          </div>
        ),
      },
      {
        header: "Amount",
        accessorKey: "totalAmount",
        cell: (row) => (
          <div className="text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              ₹{row.totalAmount || row.amount || 0}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">
              {row.paymentStatus || "PAID (DIGITAL)"}
            </div>
          </div>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: (row) => <StatusBadge status={row.status || "ACTIVE"} />,
      },
    ]
  }, [])

  return (
    <div className="space-y-6">
      {/* Header & Service Tab Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Platform Bookings & Dispatch Center
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Monitor real-time reservations, roadside breakdown dispatches, and parking bay bookings across all service verticals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("cabs")
                handleFilter({ ...filter, serviceType: "CAB" })
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "cabs"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              Cabs & Rides
              {bookingsList.length > 0 && (
                <span className="rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  {bookingsList.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("technicians")
                handleFilter({ ...filter, serviceType: "TECHNICIAN" })
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "technicians"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              Roadside Technicians
              {techBookings.length > 0 && (
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {techBookings.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("parking")
                handleFilter({ ...filter, serviceType: "PARKING" })
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "parking"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <SquareParking className="h-3.5 w-3.5" />
              Parking Facilities
              {parkingBookings.length > 0 && (
                <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  {parkingBookings.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "cabs" && (
            <PermissionGate resource="bookings" action="create">
              <Button onClick={() => handleOpen(null, "create")} className="gap-2">
                <Plus className="h-4 w-4" /> Issue New Booking
              </Button>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* ==================== TAB 1: CAB & RIDE BOOKINGS ==================== */}
      {activeTab === "cabs" && (
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
                { label: "Cab Booking", value: "CAB" },
                { label: "Technician Assistance", value: "TECHNICIAN" },
                { label: "Parking Reservations", value: "PARKING" },
                { label: "Rental", value: "RENTAL" },
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
              columns={cabColumns}
              data={bookingsList}
              isLoading={isLoadingCabs}
            />
          </div>
        </SectionCard>
      )}

      {/* ==================== TAB 2: ROADSIDE TECHNICIAN BOOKINGS ==================== */}
      {activeTab === "technicians" && (
        <SectionCard
          title="Roadside Assistance & Inspection Bookings"
          description="Monitor incoming technician callouts, emergency breakdown locations, quotes submitted by mechanics, advance commissions, and OTP verification."
        >
          <FilterBar values={filter} onChange={handleFilterChange}>
            <FilterBar.Search
              name="search"
              placeholder="Search booking #, customer, breakdown location, vehicle..."
              className="w-72"
            />
            <FilterBar.Select
              name="status"
              placeholder="All Statuses"
              options={[
                { label: "All Statuses", value: "" },
                { label: "Requested / Pending", value: "REQUESTED" },
                { label: "Assigned / In Progress", value: "ASSIGNED" },
                { label: "Quote Submitted", value: "INSPECTION_COMPLETED" },
                { label: "Completed", value: "COMPLETED" },
                { label: "Cancelled", value: "CANCELLED" },
              ]}
            />
          </FilterBar>

          <div className="mt-4">
            <DataTable
              columns={technicianColumns}
              data={techBookings}
              isLoading={isLoadingTech}
            />
          </div>
        </SectionCard>
      )}

      {/* ==================== TAB 3: PARKING RESERVATIONS ==================== */}
      {activeTab === "parking" && (
        <SectionCard
          title="Parking Facility Reservations"
          description="Monitor commercial parking bay occupancy, vehicle passes, digital gate scans, and hourly/daily parking fees."
        >
          <FilterBar values={filter} onChange={handleFilterChange}>
            <FilterBar.Search
              name="search"
              placeholder="Search booking #, customer, vehicle plate, facility..."
              className="w-72"
            />
            <FilterBar.Select
              name="status"
              placeholder="All Statuses"
              options={[
                { label: "All Statuses", value: "" },
                { label: "Active", value: "ACTIVE" },
                { label: "Parked / Checked In", value: "PARKED" },
                { label: "Completed", value: "COMPLETED" },
                { label: "Cancelled", value: "CANCELLED" },
              ]}
            />
          </FilterBar>

          <div className="mt-4">
            <DataTable
              columns={parkingColumns}
              data={parkingBookings}
              isLoading={isLoadingParking}
            />
          </div>
        </SectionCard>
      )}

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
