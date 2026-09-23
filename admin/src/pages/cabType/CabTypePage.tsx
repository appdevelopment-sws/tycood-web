import { useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Eye, Trash2, Star } from "lucide-react"
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

import { cabService } from "@/services/cabService"
import { queryKeys } from "@/lib/queryKeys"
import { INITIAL_CAB_FILTERS } from "@/constants/page/super-admin/cabs"
import CabDrawer from "@/components/dialog/CabDialog"
import type { CabVehicle } from "@/types/cab"

export const CabTypePage = () => {
  const queryClient = useQueryClient()

  const drawerDisclosure = useDisclosure<CabVehicle & { viewMode?: boolean }>()
  const deleteDisclosure = useDisclosure<CabVehicle>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_CAB_FILTERS)

  const { data: cabs = [], isLoading } = useQuery({
    queryKey: queryKeys.cabs.list(filter),
    queryFn: async () => {
      const list = await cabService.getCabs(filter)
      return list
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cabService.deleteCab(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cabs.all })
      deleteDisclosure.onClose()
      toast.success("Cab vehicle deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete cab vehicle")
    },
  })

  const handleOpen = (
    cab: CabVehicle | null = null,
    mode: "create" | "edit" | "view" = "create"
  ) => {
    drawerDisclosure.onOpen(cab ? { ...cab, viewMode: mode === "view" } : null)
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter({ ...updates, page: 1 })
    },
    [handleFilter]
  )

  const columns: Column<CabVehicle>[] = useMemo(() => {
    return [
      {
        header: "Cab Type & Representative Cars",
        accessorKey: "name",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
              <img
                src={
                  row.imageUrl?.startsWith("http")
                    ? row.imageUrl
                    : "/assets/car.png"
                }
                alt={row.name || row.vehicleCategory}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = "none"
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {row.name || row.vehicleCategory}
                </span>
                {row.badgeTag && (
                  <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[9.5px] font-bold text-orange-600 dark:text-orange-400">
                    {row.badgeTag}
                  </span>
                )}
              </div>
              <div className="text-[11.5px] font-medium text-amber-700 dark:text-amber-400">
                {row.similarModels || `${row.vehicleCategory} or similar`}
              </div>
              <div className="font-mono text-[10.5px] text-slate-400 dark:text-slate-500">
                Ref: {row.registrationNumber}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Category & Fuel",
        cell: (row) => (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {row.vehicleCategory}
              </span>
              <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                {row.fuelType || "Petrol"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>💺 {row.seatingCapacity} Seats</span>
              <span>🧳 {row.luggageCapacity} Bags</span>
            </div>
          </div>
        ),
      },
      {
        header: "Local & Per-KM Pricing",
        cell: (row) => (
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
              <span className="text-emerald-600 dark:text-emerald-400">
                ₹{row.baseFare}
              </span>
              {row.originalFare && row.originalFare > row.baseFare && (
                <span className="text-[11px] text-slate-400 line-through">
                  ₹{row.originalFare}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Base: {row.baseKm || 10}km • Extra: ₹{row.extraKmCharge}/km
            </div>
          </div>
        ),
      },
      {
        header: "Outstation & Rates",
        cell: (row) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              ₹{row.perKmCharge}/km
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Outstation: ₹{row.outstationPerKmCharge || row.perKmCharge}/km
            </div>
          </div>
        ),
      },
      {
        header: "Card Rating & ETA",
        cell: (row) => (
          <div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{row.rating || 4.8}</span>
              <span className="text-[10px] font-normal text-slate-400">
                ({row.reviewsCount || 412})
              </span>
            </div>
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              ⏱ ~{row.etaMinutes || 6} mins away
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
      <CabDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        cab={drawerDisclosure.data}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDisclosure.isOpen}
        onOpenChange={deleteDisclosure.onClose}
        title="Delete Cab Vehicle"
        description={`Are you sure you want to delete cab "${deleteDisclosure.data?.registrationNumber}" (${deleteDisclosure.data?.make} ${deleteDisclosure.data?.model})?`}
        onConfirm={() => deleteMutation.mutate(deleteDisclosure.data?.id!)}
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        variant="danger"
      />

      <SectionCard
        title="Cabs & Fleet Types"
        description="Configure fleet vehicle types, per-km rates, extra km charges, outstation logic, and real-time app presentation cards."
        action={
          <Button onClick={() => handleOpen()}>
            <Plus className="mr-2 size-4" />
            Add Cab Type
          </Button>
        }
      >
        <div className="space-y-4">
          <FilterBar
            values={{
              search: filter.search || "",
              category: filter.category || "ALL",
              status: filter.status || "ALL",
              fuelType: filter.fuelType || "ALL",
            }}
            onChange={handleFilterChange}
          >
            <FilterBar.Search
              name="search"
              placeholder="Search registration, make, model..."
              className="w-[280px]"
            />

            {/* Dynamic Category Filter */}
            <select
              value={filter.category || "ALL"}
              onChange={(e) => handleFilterChange({ category: e.target.value })}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
            >
              <option value="ALL">All Cab Types</option>
              {Array.from(
                new Set([
                  "Hatchback",
                  "Sedan",
                  "SUV / XL",
                  "Electric (EV)",
                  "Luxury",
                  ...cabs.map((c) => c.vehicleCategory).filter(Boolean),
                ])
              ).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Fuel Type Filter */}
            <select
              value={filter.fuelType || "ALL"}
              onChange={(e) => handleFilterChange({ fuelType: e.target.value })}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
            >
              <option value="ALL">All Fuel Types</option>
              <option value="CNG + Petrol">CNG + Petrol</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric (EV)">Electric (EV)</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            {/* Status Filter */}
            <select
              value={filter.status || "ALL"}
              onChange={(e) => handleFilterChange({ status: e.target.value })}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="BREAKDOWN">Breakdown</option>
              <option value="RETIRED">Retired</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </FilterBar>

          <DataTable columns={columns} data={cabs} isLoading={isLoading} />
        </div>
      </SectionCard>
    </div>
  )
}

export default CabTypePage
