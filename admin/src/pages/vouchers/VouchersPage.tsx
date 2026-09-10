import { useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Eye, Trash2, TicketPercent, EyeOff, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/common/DataTable"
import type { Column } from "@/components/common/DataTable"
import { FilterBar } from "@/components/filter-bar"
import SectionCard from "@/components/SectionCard"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirmDialog"
import { useDisclosure } from "@/hooks/useDisclosure"
import useSearchFilter from "@/hooks/useSearchFilter"

import { voucherService } from "@/services/voucherService"
import { queryKeys } from "@/lib/queryKeys"
import { INITIAL_VOUCHER_FILTERS } from "@/constants/page/super-admin/vouchers"
import VoucherDrawer from "@/components/dialog/VouchersDialog"
import type { Voucher } from "@/types/voucher"

const VouchersPage = () => {
  const queryClient = useQueryClient()

  const drawerDisclosure = useDisclosure<any>()
  const deleteDisclosure = useDisclosure<any>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_VOUCHER_FILTERS)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.vouchers.list(filter),
    queryFn: async () => {
      const list = await voucherService.getVouchers(filter)
      return list
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => voucherService.deleteVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vouchers.all })
      deleteDisclosure.onClose()
      toast.success("Voucher deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete voucher")
    },
  })

  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      voucherService.toggleVisibility(id, isVisible),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vouchers.all })
      toast.success(
        updated.isVisible
          ? `Voucher "${updated.code}" is now VISIBLE in mobile app`
          : `Voucher "${updated.code}" is now HIDDEN from mobile app`
      )
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to toggle visibility")
    },
  })

  const handleOpen = (
    voucher: any = null,
    mode: "create" | "edit" | "view" = "create"
  ) => {
    drawerDisclosure.onOpen(
      voucher ? { ...voucher, viewMode: mode === "view" } : null
    )
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter({ ...updates, page: 1 })
    },
    [handleFilter]
  )

  const columns: Column<Voucher>[] = useMemo(() => {
    return [
      {
        header: "Voucher Code & Title",
        accessorKey: "code",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              <TicketPercent className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {row.code}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {row.title}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Discount Value",
        cell: (row) => (
          <div>
            <div className="font-semibold text-emerald-600 dark:text-emerald-400">
              {row.discountType === "PERCENTAGE"
                ? `${row.discountValue}% OFF`
                : `₹${row.discountValue} OFF`}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {row.minBookingAmount > 0
                ? `Min Booking: ₹${row.minBookingAmount}`
                : "No Min Booking"}
              {row.maxDiscountAmount ? ` (Max Cap: ₹${row.maxDiscountAmount})` : ""}
            </div>
          </div>
        ),
      },
      {
        header: "Trip / Route Scope",
        cell: (row) => (
          <div className="text-xs">
            {row.trip ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold">
                {row.trip?.route ? `${row.trip.route.origin} → ${row.trip.route.destination}` : `Trip ${row.trip?.tripCode || row.tripId}`}
              </span>
            ) : (
              <span className="text-slate-500 font-medium">
                All Trips (Universal)
              </span>
            )}
          </div>
        ),
      },
      {
        header: "Usage & Limits",
        cell: (row) => (
          <div className="text-xs text-slate-700 dark:text-slate-300">
            <div>
              Used: <span className="font-bold">{row.usedCount}</span>
              {row.usageLimit ? ` / ${row.usageLimit}` : " (Unlimited)"}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Per User: {row.perUserLimit ?? 1}
            </div>
          </div>
        ),
      },
      {
        header: "App Visibility",
        cell: (row) => (
          <button
            onClick={() =>
              toggleVisibilityMutation.mutate({
                id: row.id,
                isVisible: !row.isVisible,
              })
            }
            title="Click to toggle app visibility"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              row.isVisible
                ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {row.isVisible ? (
              <>
                <Eye className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Visible in App</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                <span>Hidden in App</span>
              </>
            )}
          </button>
        ),
      },
      {
        header: "Status",
        cell: (row) => (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              row.isActive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
            }`}
          >
            {row.isActive ? (
              <>
                <CheckCircle2 className="h-3 w-3" /> Active
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" /> Inactive
              </>
            )}
          </span>
        ),
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
  }, [deleteDisclosure, toggleVisibilityMutation])

  return (
    <div className="space-y-6">
      <VoucherDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        voucher={drawerDisclosure.data}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDisclosure.isOpen}
        onOpenChange={deleteDisclosure.onClose}
        title="Delete Voucher"
        description={`Are you sure you want to delete voucher "${deleteDisclosure.data?.code}"?`}
        onConfirm={() => deleteMutation.mutate(deleteDisclosure.data?.id)}
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        variant="danger"
      />

      <SectionCard
        title="Vouchers & Promo Codes"
        description="Manage promotional codes, discounts, redemption limits, and mobile app visibility settings"
        action={
          <Button onClick={() => handleOpen()}>
            <Plus className="mr-2 size-4" />
            Create Voucher
          </Button>
        }
      >
        <div className="space-y-4">
          <FilterBar
            values={{
              search: filter.search || "",
              status: filter.status || "",
              isVisible: filter.isVisible || "",
            }}
            onChange={handleFilterChange}
          >
            <FilterBar.Search
              name="search"
              placeholder="Search voucher code, title..."
              className="w-[280px]"
            />

            <FilterBar.Select
              name="isVisible"
              placeholder="All App Visibility"
              options={[
                { label: "Visible in App", value: "true" },
                { label: "Hidden in App", value: "false" },
              ]}
              className="w-[180px]"
            />

            <FilterBar.Select
              name="status"
              placeholder="All Statuses"
              options={[
                { label: "Active", value: "ACTIVE" },
                { label: "Inactive", value: "INACTIVE" },
              ]}
              className="w-[150px]"
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

export { VouchersPage }
export default VouchersPage
