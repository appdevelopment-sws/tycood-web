import { useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Eye, Trash2, Building2, Star } from "lucide-react"
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

import { operatorService } from "@/services/operatorService"
import { queryKeys } from "@/lib/queryKeys"

import { INITIAL_OPERATOR_FILTERS } from "@/constants/page/super-admin/operators"
import OperatorDrawer from "@/components/dialog/OperatorsDialog"

const OperatorsPage = () => {
  const queryClient = useQueryClient()

  const drawerDisclosure = useDisclosure<any>()
  const deleteDisclosure = useDisclosure<any>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_OPERATOR_FILTERS)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.operators.list(filter),
    queryFn: async () => {
      const list = await operatorService.getOperators()
      if (filter.search) {
        const query = filter.search.toLowerCase()
        return list.filter(
          (op) =>
            op.name.toLowerCase().includes(query) ||
            op.code.toLowerCase().includes(query)
        )
      }
      return list
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => operatorService.deleteOperator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.operators.all })
      deleteDisclosure.onClose()
      toast.success("Operator deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete operator")
    },
  })

  const handleOpen = (
    operator: any = null,
    mode: "create" | "edit" | "view" = "create"
  ) => {
    drawerDisclosure.onOpen(
      operator ? { ...operator, viewMode: mode === "view" } : null
    )
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter({ ...updates, page: 1 })
    },
    [handleFilter]
  )

  const columns: Column<any>[] = useMemo(() => {
    return [
      {
        header: "Operator Name",
        accessorKey: "name",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 font-bold">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {row.name}
              </div>
              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Code: {row.code}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Contact Info",
        cell: (row) => (
          <div>
            <div className="text-slate-800 dark:text-slate-200">
              {row.contactEmail || "—"}
            </div>
            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {row.contactPhone || "—"}
            </div>
          </div>
        ),
      },
      {
        header: "Fleet Size",
        cell: (row) => (
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {row.totalFleetCount ?? 0} Buses
          </span>
        ),
      },
      {
        header: "Active Dispatch",
        cell: (row) => (
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {row.activeTripsCount ?? 0} Live Trips
          </span>
        ),
      },
      {
        header: "Rating",
        cell: (row) => (
          <div className="flex items-center gap-1 font-semibold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{row.rating ?? "4.5"}</span>
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
      <OperatorDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        operator={drawerDisclosure.data}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDisclosure.isOpen}
        onOpenChange={deleteDisclosure.onClose}
        title="Delete Bus Operator"
        description={`Are you sure you want to delete "${deleteDisclosure.data?.name}"?`}
        onConfirm={() => deleteMutation.mutate(deleteDisclosure.data?.id)}
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        variant="danger"
      />

      <SectionCard
        title="Bus Operators"
        description="Manage partner operators, fleet contracts, ratings, and active dispatches"
        action={
          <Button onClick={() => handleOpen()}>
            <Plus className="mr-2 size-4" />
            Add Operator
          </Button>
        }
      >
        <div className="space-y-4">
          <FilterBar
            values={{ search: filter.search || "" }}
            onChange={handleFilterChange}
          >
            <FilterBar.Search
              name="search"
              placeholder="Search operators..."
              className="w-[300px]"
            />
          </FilterBar>

          <DataTable
            columns={columns}
            data={data || []}
            isLoading={isLoading}
          />
        </div>
      </SectionCard>
    </div>
  )
}

export { OperatorsPage }
export default OperatorsPage
