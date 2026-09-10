import { useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Eye, Trash2, Bus as BusIcon } from "lucide-react"
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

import { busService } from "@/services/busService"
import { operatorService } from "@/services/operatorService"
import { queryKeys } from "@/lib/queryKeys"

import { INITIAL_BUS_FILTERS } from "@/constants/page/super-admin/buses"
import BusDrawer from "@/components/dialog/BusesDialog"
import type { Bus } from "@/types/bus"

export const BusesPage = () => {
  const queryClient = useQueryClient()

  const drawerDisclosure = useDisclosure<any>()
  const deleteDisclosure = useDisclosure<any>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_BUS_FILTERS)

  const { data: buses = [], isLoading } = useQuery({
    queryKey: queryKeys.buses.list(filter),
    queryFn: async () => {
      const list = await busService.getBuses(filter)
      return list
    },
  })

  // Fetch operators for filter dropdown
  const { data: operators = [] } = useQuery({
    queryKey: queryKeys.operators.all,
    queryFn: () => operatorService.getOperators(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => busService.deleteBus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buses.all })
      deleteDisclosure.onClose()
      toast.success("Bus deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete bus")
    },
  })

  const handleOpen = (
    bus: Bus | null = null,
    mode: "create" | "edit" | "view" = "create"
  ) => {
    drawerDisclosure.onOpen(
      bus ? { ...bus, viewMode: mode === "view" } : null
    )
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter({ ...updates, page: 1 })
    },
    [handleFilter]
  )

  const columns: Column<Bus>[] = useMemo(() => {
    return [
      {
        header: "Registration & Vehicle",
        accessorKey: "registrationNumber",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 font-bold">
              <BusIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {row.registrationNumber}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {row.busName} {row.internalCode ? `• ${row.internalCode}` : ""}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Operator",
        cell: (row) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {row.operator?.name || row.operatorName || "Unassigned"}
            </div>
            {row.operator?.code && (
              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Code: {row.operator.code}
              </div>
            )}
          </div>
        ),
      },
      {
        header: "Type & Spec",
        cell: (row) => (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {row.busType}
              </span>
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${row.isAC ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                {row.isAC ? "AC" : "Non-AC"}
              </span>
            </div>
            {row.category && (
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Category: {row.category}
              </div>
            )}
          </div>
        ),
      },
      {
        header: "Capacity & Layout",
        cell: (row) => (
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {row.seatingCapacity || row.totalSeats || 36} Seats
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Layout: {row.layoutType || "2x2"}
            </div>
          </div>
        ),
      },
      {
        header: "Status",
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

            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => handleOpen(row, "edit")}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600"
              onClick={() => deleteDisclosure.onOpen(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ]
  }, [deleteDisclosure])

  return (
    <div className="space-y-6">
      <BusDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        bus={drawerDisclosure.data}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDisclosure.isOpen}
        onOpenChange={deleteDisclosure.onClose}
        title="Delete Bus Vehicle"
        description={`Are you sure you want to delete bus "${deleteDisclosure.data?.registrationNumber}" (${deleteDisclosure.data?.busName})?`}
        onConfirm={() => deleteMutation.mutate(deleteDisclosure.data?.id)}
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        variant="danger"
      />

      <SectionCard
        title="Buses & Fleet Inventory"
        description="Register new vehicles, manage seat layout patterns, assign operators, and track maintenance statuses."
        action={
          <Button onClick={() => handleOpen()}>
            <Plus className="mr-2 size-4" />
            Add Vehicle
          </Button>
        }
      >
        <div className="space-y-4">
          <FilterBar
            values={{
              search: filter.search || "",
              busType: filter.busType || "ALL",
              status: filter.status || "ALL",
              operatorId: filter.operatorId || "ALL",
            }}
            onChange={handleFilterChange}
          >
            <FilterBar.Search
              name="search"
              placeholder="Search registration, name, internal code..."
              className="w-[280px]"
            />

            {/* Bus Type Filter */}
            <select
              value={filter.busType || "ALL"}
              onChange={(e) => handleFilterChange({ busType: e.target.value })}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
            >
              <option value="ALL">All Bus Types</option>
              <option value="SEATER">Seater</option>
              <option value="SLEEPER">Sleeper</option>
              <option value="SEMI_SLEEPER">Semi-Sleeper</option>
              <option value="HYBRID">Hybrid</option>
            </select>

            {/* Status Filter */}
            <select
              value={filter.status || "ALL"}
              onChange={(e) => handleFilterChange({ status: e.target.value })}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="BREAKDOWN">Breakdown</option>
              <option value="RETIRED">Retired</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Operator Filter */}
            <select
              value={filter.operatorId || "ALL"}
              onChange={(e) => handleFilterChange({ operatorId: e.target.value })}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
            >
              <option value="ALL">All Operators</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
          </FilterBar>

          <DataTable
            columns={columns}
            data={buses}
            isLoading={isLoading}
          />
        </div>
      </SectionCard>
    </div>
  )
}

export default BusesPage
