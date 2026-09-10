import React from "react"
import { MetricCard } from "../../components/common/MetricCard"
import { DataTable } from "../../components/common/DataTable"
import type { Column } from "../../components/common/DataTable"
import { StatusBadge } from "../../components/common/StatusBadge"
import type { Booking } from "../../types/bus"
import { RotateCw, AlertTriangle } from "lucide-react"
import { Button } from "../../components/ui/button"
import { useDashboard } from "../../hooks/useDashboard"

export const DashboardPage: React.FC = () => {
  const { metrics, recentBookings, isLoading, error, refetch } = useDashboard()

  const bookingColumns: Column<Booking>[] = [
    {
      header: "Ticket #",
      accessorKey: "ticketNumber",
      cell: (row) => (
        <span className="font-mono font-semibold text-indigo-400">
          {row.ticketNumber}
        </span>
      ),
    },
    {
      header: "Passenger",
      accessorKey: "passengerName",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.passengerName}</div>
          <div className="text-[11px] text-slate-400">{row.passengerEmail}</div>
        </div>
      ),
    },
    {
      header: "Route Corridor",
      accessorKey: "routeName",
      cell: (row) => <span className="font-medium">{row.routeName}</span>,
    },
    {
      header: "Seats",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.seatNumbers || []).map((s, idx) => (
            <span
              key={`${s}-${idx}`}
              className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
            >
              {s}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Amount",
      cell: (row) => (
        <span className="font-semibold">
          ₹
          {Number(row.totalAmount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Booked Time",
      accessorKey: "bookedAt",
      className: "text-slate-400",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Operations Command Center
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time platform metrics, live trip dispatches, and recent
            passenger bookings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-1.5 text-xs font-medium"
          >
            <RotateCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {/* <PermissionGate resource="trips" action="create">
            <Button className="gap-1.5 text-xs font-semibold text-white">
              <Plus className="h-4 w-4" /> Dispatch New Trip
            </Button>
          </PermissionGate> */}
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-500 dark:border-amber-500/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Backend Communication Alert
              </p>
              <p className="text-xs text-amber-400/90">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-amber-500/40 text-xs text-amber-400 hover:bg-amber-500/20"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100 p-5 dark:border-slate-800 dark:bg-slate-800/50"
              />
            ))
          : metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      {/* Recent Bookings Table */}
      <DataTable
        title="Live Reservation Stream"
        subtitle="Most recent bookings placed across website and passenger mobile apps"
        columns={bookingColumns}
        data={recentBookings}
        isLoading={isLoading}
        searchField="passengerName"
        searchPlaceholder="Search passenger or ticket..."
      />
    </div>
  )
}
