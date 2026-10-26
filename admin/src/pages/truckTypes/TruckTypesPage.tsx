import { useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Eye, Trash2, Truck, Ruler, Weight } from "lucide-react"
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

import { logisticsService } from "@/services/logisticsService"
import { queryKeys } from "@/lib/queryKeys"
import TruckTypeDrawer from "@/components/dialog/TruckTypeDialog"
import type { TruckType, TruckTypeFilterParams } from "@/types/logistics"

const INITIAL_FILTERS: TruckTypeFilterParams = {
  search: "",
  category: "ALL",
  isActive: "ALL",
  page: 1,
  limit: 50,
}

const CATEGORY_FILTER_OPTIONS = [
  { label: "All Categories", value: "ALL" },
  { label: "Open Body", value: "Open" },
  { label: "Container", value: "Container" },
  { label: "LCV", value: "LCV" },
  { label: "Mini / Pickup", value: "Mini/Pickup" },
  { label: "Flatbed Trailer", value: "Trailer" },
  { label: "Tipper", value: "Tipper" },
  { label: "Tanker", value: "Tanker" },
  { label: "Dumper", value: "Dumper" },
  { label: "Bulker", value: "Bulker" },
]

export const TruckTypesPage = () => {
  const queryClient = useQueryClient()

  const drawerDisclosure = useDisclosure<TruckType & { viewMode?: boolean }>()
  const deleteDisclosure = useDisclosure<TruckType>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_FILTERS)

  const { data: truckTypes = [], isLoading } = useQuery({
    queryKey: queryKeys.truckTypes.list(filter),
    queryFn: async () => {
      const list = await logisticsService.getTruckTypes(filter)
      return list
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => logisticsService.deleteTruckType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.truckTypes.all })
      deleteDisclosure.onClose()
      toast.success("Truck type deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete truck type")
    },
  })

  const handleOpen = (
    item: TruckType | null = null,
    mode: "create" | "edit" | "view" = "create"
  ) => {
    drawerDisclosure.onOpen(item ? { ...item, viewMode: mode === "view" } : null)
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter({ ...updates, page: 1 })
    },
    [handleFilter]
  )

  const columns: Column<TruckType>[] = useMemo(() => {
    return [
      {
        header: "Vehicle Type & Classification",
        accessorKey: "name",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-primary dark:border-slate-800 dark:bg-slate-900">
              <Truck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {row.name}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-primary">{row.category}</span>
                <span>•</span>
                <span>{row.bodyType}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Dimensions (Length × Width × Height)",
        accessorKey: "lengthFt",
        cell: (row) => (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
              <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                {row.lengthFt} ft × {row.widthFt} ft × {row.heightFt} ft
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {row.dimensionLabel || `${row.lengthFt}ft Deck`}
            </span>
          </div>
        ),
      },
      {
        header: "Tonnage & Wheels",
        accessorKey: "capacityRange",
        cell: (row) => (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
              <Weight className="h-3.5 w-3.5 text-amber-600" />
              <span>{row.capacityRange}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {row.wheelCount} ({row.wheelsNumber} Tyres)
            </span>
          </div>
        ),
      },
      {
        header: "Suitable Cargo & Goods",
        accessorKey: "suitableMaterials",
        cell: (row) => (
          <div className="flex flex-wrap gap-1 max-w-[280px]">
            {row.suitableMaterials && row.suitableMaterials.length > 0 ? (
              row.suitableMaterials.slice(0, 3).map((mat, i) => (
                <span
                  key={i}
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {mat}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">General cargo</span>
            )}
            {row.suitableMaterials && row.suitableMaterials.length > 3 && (
              <span className="text-[11px] text-muted-foreground font-medium">
                +{row.suitableMaterials.length - 3} more
              </span>
            )}
          </div>
        ),
      },
      {
        header: "Status",
        accessorKey: "isActive",
        cell: (row) => (
          <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} />
        ),
      },
      {
        header: "Actions",
        accessorKey: "id",
        cell: (row) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => handleOpen(row, "view")}
              title="View vehicle specifications"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => handleOpen(row, "edit")}
              title="Edit vehicle specifications"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => deleteDisclosure.onOpen(row)}
              title="Delete vehicle type"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ]
  }, [])

  return (
    <div className="space-y-6">
      <SectionCard
        title="Logistics Vehicle & Truck Types"
        description="Manage truck categories, body dimensions (length, height), tonnage limits, and supported cargo for optimal freight matching."
        action={
          <Button onClick={() => handleOpen(null, "create")} className="gap-2">
            <Plus className="h-4 w-4" /> Add Truck Type
          </Button>
        }
      >
        <div className="space-y-4">
          <FilterBar
            values={{
              search: filter.search || "",
              category: filter.category || "ALL",
              isActive: filter.isActive || "ALL",
            }}
            onChange={handleFilterChange}
          >
            <FilterBar.Search
              name="search"
              placeholder="Search by name, category, or dimensions..."
              className="w-[280px]"
            />
            <FilterBar.Select
              name="category"
              options={CATEGORY_FILTER_OPTIONS}
            />
            <FilterBar.Select
              name="isActive"
              options={[
                { label: "All Statuses", value: "ALL" },
                { label: "Active Only", value: "true" },
                { label: "Inactive Only", value: "false" },
              ]}
            />
          </FilterBar>

          <DataTable
            columns={columns}
            data={truckTypes}
            isLoading={isLoading}
          />
        </div>
      </SectionCard>

      {/* Unified Create / Edit / View Drawer */}
      <TruckTypeDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        truckType={drawerDisclosure.data}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDisclosure.isOpen}
        onOpenChange={deleteDisclosure.onClose}
        title="Delete Truck Type"
        description={`Are you sure you want to delete "${deleteDisclosure.data?.name}"? Drivers will no longer be able to filter freight loads using this vehicle type.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteDisclosure.data?.id) {
            deleteMutation.mutate(deleteDisclosure.data.id)
          }
        }}
      />
    </div>
  )
}

export default TruckTypesPage
