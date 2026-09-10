import { useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Eye, Trash2, User as UserIcon } from "lucide-react"
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

import { userService } from "@/services/userService"
import { queryKeys } from "@/lib/queryKeys"
import { INITIAL_USER_FILTERS } from "@/constants/page/super-admin/users"
import UserDrawer from "@/components/dialog/UserDrawer"
import type { PassengerUser } from "@/types/user"

export const UsersPage = () => {
  const queryClient = useQueryClient()

  const drawerDisclosure = useDisclosure<any>()
  const deleteDisclosure = useDisclosure<any>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_USER_FILTERS)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.list(filter),
    queryFn: async () => {
      const list = await userService.getUsers({
        search: filter.search || undefined,
        status: filter.status || undefined,
        role: filter.role || undefined,
      })
      return list
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      deleteDisclosure.onClose()
      toast.success("User account deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete user account")
    },
  })

  const handleOpen = (
    user: any = null,
    mode: "create" | "edit" | "view" = "create"
  ) => {
    drawerDisclosure.onOpen(
      user ? { ...user, viewMode: mode === "view" } : null
    )
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter({ ...updates, page: 1 })
    },
    [handleFilter]
  )

  const columns: Column<PassengerUser>[] = useMemo(() => {
    return [
      {
        header: "User Account",
        accessorKey: "name",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 font-bold text-indigo-500">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {row.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {row.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "User Type / Role",
        cell: (row) => {
          const primaryRole = row.roles?.[0]?.toUpperCase() || "USER"
          switch (primaryRole) {
            case "SUPER_ADMIN":
              return (
                <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Super Admin
                </span>
              )
            case "DRIVER":
              return (
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Driver User
                </span>
              )
            case "AGENT":
              return (
                <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Booking Agent
                </span>
              )
            default:
              return (
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Passenger (User)
                </span>
              )
          }
        },
      },
      {
        header: "Phone Number",
        cell: (row) => <span className="font-mono text-slate-700 dark:text-slate-300">{row.phone || "—"}</span>,
      },
      {
        header: "Total Bookings",
        cell: (row) => (
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {row.totalTripsCount ?? 0} Trips
          </span>
        ),
      },
      {
        header: "Wallet Balance",
        cell: (row) => (
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            ${(row.walletBalance ?? 0).toFixed(2)}
          </span>
        ),
      },
      {
        header: "Status",
        cell: (row) => (
          <StatusBadge status={row.status || (row.isActive ? "ACTIVE" : "INACTIVE")} />
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
  }, [deleteDisclosure])

  return (
    <div className="space-y-6">
      <UserDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        user={drawerDisclosure.data}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDisclosure.isOpen}
        onOpenChange={deleteDisclosure.onClose}
        title="Delete User Account"
        description={`Are you sure you want to delete user account "${deleteDisclosure.data?.name}"?`}
        onConfirm={() => deleteMutation.mutate(deleteDisclosure.data?.id)}
        isLoading={deleteMutation.isPending}
        confirmText="Delete Account"
        variant="danger"
      />

      <SectionCard
        title="User Accounts"
        description="Manage user profiles, account credentials, assigned roles (Passenger, Driver, Super Admin), and status."
        action={
          <Button onClick={() => handleOpen()}>
            <Plus className="mr-2 size-4" />
            Add User Account
          </Button>
        }
      >
        <div className="space-y-4">
          <FilterBar
            values={{ search: filter.search || "", status: filter.status || "", role: filter.role || "" }}
            onChange={handleFilterChange}
          >
            <FilterBar.Search
              name="search"
              placeholder="Search user name, email, phone..."
              className="w-[280px]"
            />
            <FilterBar.Select
              name="role"
              placeholder="All User Types"
              options={[
                { label: "All User Types", value: "" },
                { label: "Passenger (User)", value: "USER" },
                { label: "Driver User", value: "DRIVER" },
                { label: "Super Admin", value: "SUPER_ADMIN" },
                { label: "Booking Agent", value: "AGENT" },
              ]}
            />
            <FilterBar.Select
              name="status"
              placeholder="All Statuses"
              options={[
                { label: "All Statuses", value: "" },
                { label: "Active", value: "ACTIVE" },
                { label: "Inactive", value: "INACTIVE" },
              ]}
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

export default UsersPage
