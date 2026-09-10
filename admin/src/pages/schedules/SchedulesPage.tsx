import React from "react"
import { DataTable } from "../../components/common/DataTable"
import type { Column } from "../../components/common/DataTable"
import { StatusBadge } from "../../components/common/StatusBadge"
import type { Schedule } from "../../types/bus"
import { PermissionGate } from "../../components/common/PermissionGate"
import { Button } from "../../components/ui/button"
import { Plus, CalendarDays, Clock, Bus } from "lucide-react"

export const SchedulesPage: React.FC = () => {
  const schedules: Schedule[] = [
    {
      id: "sch-001",
      routeId: "rt-101",
      routeName: "New York Express → Boston Central",
      busId: "bus-001",
      busRegistration: "NY-BUS-8891",
      departureTime: "08:00 AM",
      arrivalTime: "12:30 PM",
      frequency: "DAILY",
      basePrice: 55.0,
      status: "ACTIVE",
    },
    {
      id: "sch-002",
      routeId: "rt-101",
      routeName: "New York Express → Boston Central",
      busId: "bus-002",
      busRegistration: "MA-BUS-4412",
      departureTime: "02:00 PM",
      arrivalTime: "06:30 PM",
      frequency: "DAILY",
      basePrice: 55.0,
      status: "ACTIVE",
    },
    {
      id: "sch-003",
      routeId: "rt-102",
      routeName: "Washington D.C. → Philadelphia Main",
      busId: "bus-003",
      busRegistration: "DC-BUS-9901",
      departureTime: "09:30 AM",
      arrivalTime: "12:30 PM",
      frequency: "WEEKDAYS",
      basePrice: 45.0,
      status: "ACTIVE",
    },
    {
      id: "sch-004",
      routeId: "rt-103",
      routeName: "Chicago Terminal → Detroit Metro",
      busId: "bus-004",
      busRegistration: "PA-BUS-3310",
      departureTime: "11:00 PM",
      arrivalTime: "04:30 AM",
      frequency: "WEEKENDS",
      basePrice: 65.0,
      status: "INACTIVE",
    },
  ]

  const columns: Column<Schedule>[] = [
    {
      header: "Route Corridor",
      accessorKey: "routeName",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold">{row.routeName}</div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
              <Bus className="h-3 w-3 text-slate-500" />
              <span>{row.busRegistration}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Departure / Arrival",
      cell: (row) => (
        <div className="flex items-center gap-2 text-xs">
          <Clock className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
          <span className="font-semibold">{row.departureTime}</span>
          <span className="text-slate-500">→</span>
          <span className="font-semibold">{row.arrivalTime}</span>
        </div>
      ),
    },
    {
      header: "Frequency",
      cell: (row) => (
        <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">
          {row.frequency}
        </span>
      ),
    },
    {
      header: "Base Ticket Price",
      cell: (row) => (
        <span className="font-bold text-emerald-400">
          ${row.basePrice.toFixed(2)}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Master Schedules
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Set up recurring daily/weekly trip slots, base fares, and vehicle
            assignments.
          </p>
        </div>

        <PermissionGate resource="schedules" action="create">
          <Button className="gap-1.5 text-xs font-semibold text-white">
            <Plus className="h-4 w-4" /> Create Schedule
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        title="Active Schedule Templates"
        columns={columns}
        data={schedules}
        searchField="routeName"
        searchPlaceholder="Search route corridor or bus registration..."
      />
    </div>
  )
}
