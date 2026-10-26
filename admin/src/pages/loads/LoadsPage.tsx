import { useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Eye, Trash2, ArrowRight, Phone, CheckCircle2 } from "lucide-react"
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
import LoadDrawer from "@/components/dialog/LoadDialog"
import type { Load, LoadFilterParams } from "@/types/logistics"

const INITIAL_FILTERS: LoadFilterParams = {
  search: "",
  pickupCity: "ALL",
  unloadingCity: "ALL",
  truckCategory: "ALL",
  status: "ALL",
  page: 1,
  limit: 30,
}

export const LoadsPage = () => {
  const queryClient = useQueryClient()

  const drawerDisclosure = useDisclosure<Load & { viewMode?: boolean }>()
  const deleteDisclosure = useDisclosure<Load>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_FILTERS)

  const { data: loads = [], isLoading } = useQuery({
    queryKey: queryKeys.loads.list(filter),
    queryFn: async () => {
      const list = await logisticsService.getLoads(filter)
      return list
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => logisticsService.deleteLoad(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loads.all })
      deleteDisclosure.onClose()
      toast.success("Cargo load deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete cargo load")
    },
  })

  const handleOpen = (
    item: Load | null = null,
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

  const columns: Column<Load>[] = useMemo(() => {
    return [
      {
        header: "Load ID & Route",
        accessorKey: "loadNumber",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-mono text-xs font-semibold text-primary">
              #{row.loadNumber}
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              <span>{row.pickupCity}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{row.unloadingCity}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {row.distanceKm} km • {row.pickupState}
            </span>
          </div>
        ),
      },
      {
        header: "Cargo & Requirements",
        accessorKey: "product",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {row.product}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <span className="font-semibold text-amber-600">{row.totalLoadTons}</span>
              <span>•</span>
              <span>{row.requiredTruckTypeDesc} ({row.requiredWheels})</span>
            </div>
            {row.productLengthFt ? (
              <span className="text-[11px] text-primary font-medium">
                Length: {row.productLengthFt}ft Required
              </span>
            ) : null}
          </div>
        ),
      },
      {
        header: "Rate & Terms",
        accessorKey: "ratePerTruck",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              ₹{Number(row.ratePerTruck).toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.isRateNegotiable ? "Negotiable" : "Fixed Rate"} • {row.paymentTerms}
            </span>
          </div>
        ),
      },
      {
        header: "Transporter Info",
        accessorKey: "transporterCompany",
        cell: (row) => (
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                {row.transporterCompany}
              </span>
              {row.isTransporterVerified && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {row.transporterName} • ★ {row.transporterRating}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Phone className="h-3 w-3" /> {row.transporterPhone}
            </span>
          </div>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: (row) => <StatusBadge status={row.status} />,
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
              title="View load details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => handleOpen(row, "edit")}
              title="Edit load"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => deleteDisclosure.onOpen(row)}
              title="Delete load"
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
        title="Freight Cargo Loads"
        description="Active freight and cargo shipments available on the driver Load Board in the user application."
        action={
          <Button onClick={() => handleOpen(null, "create")} className="gap-2">
            <Plus className="h-4 w-4" /> Post New Load
          </Button>
        }
      >
        <div className="space-y-4">
          <FilterBar
            values={{
              search: filter.search || "",
              status: filter.status || "ALL",
            }}
            onChange={handleFilterChange}
          >
            <FilterBar.Search
              name="search"
              placeholder="Search product, origin, destination, or transporter..."
              className="w-[300px]"
            />
            <FilterBar.Select
              name="status"
              options={[
                { label: "All Statuses", value: "ALL" },
                { label: "Open Only", value: "OPEN" },
                { label: "Assigned", value: "ASSIGNED" },
                { label: "In Transit", value: "IN_TRANSIT" },
                { label: "Delivered", value: "DELIVERED" },
              ]}
            />
          </FilterBar>

          <DataTable
            columns={columns}
            data={loads}
            isLoading={isLoading}
          />
        </div>
      </SectionCard>

      <LoadDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        load={drawerDisclosure.data}
      />

      <ConfirmDialog
        open={deleteDisclosure.isOpen}
        onOpenChange={deleteDisclosure.onClose}
        title="Delete Cargo Load"
        description={`Are you sure you want to delete Load #${deleteDisclosure.data?.loadNumber}? This will remove it from the driver Load Board.`}
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

export default LoadsPage
