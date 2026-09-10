import { useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Eye, Trash2, Navigation, User, Calendar, Clock, Bus, CheckCircle2, AlertTriangle } from "lucide-react"
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
import { PermissionGate } from "@/components/common/PermissionGate"

import { tripService } from "@/services/tripService"
import { queryKeys } from "@/lib/queryKeys"
import { INITIAL_TRIP_FILTERS } from "@/constants/page/super-admin/trips"
import TripsDialog from "@/components/dialog/TripsDialog"
import type { Trip } from "@/types/bus"

export const TripsPage = () => {
  const queryClient = useQueryClient()

  const drawerDisclosure = useDisclosure<any>()
  const deleteDisclosure = useDisclosure<any>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_TRIP_FILTERS)

  const { data: paginatedTrips, isLoading } = useQuery({
    queryKey: queryKeys.trips.list(filter),
    queryFn: async () => {
      return tripService.getTrips({
        search: filter.search || undefined,
        status: filter.status || undefined,
        routeId: filter.routeId || undefined,
        busId: filter.busId || undefined,
        driverId: filter.driverId || undefined,
        page: filter.page || 1,
        limit: filter.limit || 20,
      })
    },
  })

  const trips: Trip[] = paginatedTrips?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tripService.deleteTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all })
      deleteDisclosure.onClose()
      toast.success("Trip schedule deleted / cancelled successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete trip")
    },
  })

  const handleOpen = (
    trip: Trip | null = null,
    mode: "create" | "edit" | "view" = "create"
  ) => {
    drawerDisclosure.onOpen(
      trip ? { ...trip, viewMode: mode === "view" } : null
    )
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter({ ...updates, page: 1 })
    },
    [handleFilter]
  )

  // Compute live statistics counters
  const stats = useMemo(() => {
    const total = trips.length
    const scheduled = trips.filter((t) => t.status === "SCHEDULED").length
    const inTransit = trips.filter((t) => t.status === "IN_TRANSIT").length
    const completed = trips.filter((t) => t.status === "COMPLETED").length
    const delayedOrCancelled = trips.filter((t) => t.status === "DELAYED" || t.status === "CANCELLED").length
    return { total, scheduled, inTransit, completed, delayedOrCancelled }
  }, [trips])

  const columns: Column<Trip>[] = useMemo(() => {
    return [
      {
        header: "Trip Code & Route",
        accessorKey: "tripCode",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 font-bold shrink-0">
              <Navigation className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                {row.tripCode || `TRIP-${row.id.slice(0, 8).toUpperCase()}`}
              </div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {row.routeName || "Standard Bus Route"}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Bus & Driver",
        cell: (row) => (
          <div>
            <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
              <Bus className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>{row.busRegistration || "N/A"}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <User className="h-3 w-3 shrink-0" />
              <span>{row.driverName || "Unassigned"}</span>
            </div>
          </div>
        ),
      },
      {
        header: "Departure / Timing",
        cell: (row) => {
          if (!row.departureTime) return <span className="text-xs text-slate-400">—</span>
          let formattedTime = row.departureTime
          try {
            const d = new Date(row.departureTime)
            if (!isNaN(d.getTime())) {
              formattedTime = d.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            }
          } catch {}

          return (
            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">
              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{formattedTime}</span>
            </div>
          )
        },
      },
      {
        header: "Seat Occupancy",
        cell: (row) => {
          const totalSeats = row.totalSeats || 36
          const availSeats = row.availableSeats ?? totalSeats
          const bookedSeats = Math.max(0, totalSeats - availSeats)
          const percent = Math.min(100, Math.round((bookedSeats / totalSeats) * 100))

          return (
            <div className="w-36">
              <div className="mb-1 flex justify-between text-[11px] font-medium">
                <span className="text-slate-600 dark:text-slate-400">
                  {bookedSeats}/{totalSeats} Booked
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{percent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    percent >= 100
                      ? "bg-rose-500"
                      : percent >= 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        },
      },
      {
        header: "Fare",
        cell: (row) => {
          const price = Number(row.farePrice) || 0
          return (
            <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
              ₹{price.toFixed(2)}
            </span>
          )
        },
      },
      {
        header: "Live Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        header: "Actions",
        className: "text-right",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => handleOpen(row, "view")}
            >
              <Eye className="h-4 w-4" />
            </Button>

            <PermissionGate resource="trips" action="update">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => handleOpen(row, "edit")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </PermissionGate>

            <PermissionGate resource="trips" action="delete">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600"
                onClick={() => deleteDisclosure.onOpen(row)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </PermissionGate>
          </div>
        ),
      },
    ]
  }, [deleteDisclosure])

  return (
    <div className="space-y-6">
      {/* Trip Modal Drawer */}
      <TripsDialog
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        trip={drawerDisclosure.data}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDisclosure.isOpen}
        onOpenChange={deleteDisclosure.onClose}
        title="Cancel & Delete Trip Schedule"
        description={`Are you sure you want to cancel trip "${deleteDisclosure.data?.tripCode || deleteDisclosure.data?.id}"? This operation will remove the dispatch.`}
        onConfirm={() => deleteMutation.mutate(deleteDisclosure.data?.id)}
        isLoading={deleteMutation.isPending}
        confirmText="Delete Trip"
        variant="danger"
      />

      {/* Header Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Dispatches</span>
            <Calendar className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Scheduled / Upcoming</span>
            <Clock className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">{stats.scheduled}</div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active On-Time / In-Transit</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.inTransit}</div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Delayed / Cancelled</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.delayedOrCancelled}</div>
        </div>
      </div>

      {/* Main Section Card & DataTable */}
      <SectionCard
        title="Live Trips & Dispatch Monitor"
        description="Track real-time bus dispatches, seat availability, assigned drivers, schedules, and trip statuses"
        action={
          <PermissionGate resource="trips" action="create">
            <Button onClick={() => handleOpen()}>
              <Plus className="mr-2 size-4" />
              Dispatch New Trip
            </Button>
          </PermissionGate>
        }
      >
        <div className="space-y-4">
          <FilterBar
            values={{ search: filter.search || "", status: filter.status || "" }}
            onChange={handleFilterChange}
          >
            <FilterBar.Search
              name="search"
              placeholder="Search trip code, route, bus registration, or driver..."
              className="w-[340px]"
            />
            <FilterBar.Select
              name="status"
              placeholder="All Statuses"
              options={[
                { label: "All Statuses", value: "" },
                { label: "Scheduled", value: "SCHEDULED" },
                { label: "In Transit / On Time", value: "IN_TRANSIT" },
                { label: "Delayed", value: "DELAYED" },
                { label: "Cancelled", value: "CANCELLED" },
                { label: "Completed", value: "COMPLETED" },
              ]}
              className="w-[200px]"
            />
          </FilterBar>

          <DataTable
            columns={columns}
            data={trips}
            isLoading={isLoading}
          />
        </div>
      </SectionCard>
    </div>
  )
}

export default TripsPage
