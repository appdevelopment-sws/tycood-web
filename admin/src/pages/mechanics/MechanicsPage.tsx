import { useCallback, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Wrench,
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Layers,
  HelpCircle,
  CreditCard,
} from "lucide-react"
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

import {
  technicianService,
  type Technician,
  type TechnicianCategory,
} from "@/services/technicianService"
import TechnicianDrawer from "@/components/dialog/TechnicianDrawer"
import TechnicianCategoryDrawer from "@/components/dialog/TechnicianCategoryDrawer"

const INITIAL_MECHANIC_FILTERS = {
  search: "",
  verificationStatus: "",
  availabilityStatus: "",
}

export const MechanicsPage = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<
    "mechanics" | "categories" | "bookings"
  >("mechanics")

  // Disclosures
  const drawerDisclosure = useDisclosure<Technician>()
  const rejectDisclosure = useDisclosure<Technician>()
  const deleteTechnicianDisclosure = useDisclosure<Technician>()
  const [rejectReason, setRejectReason] = useState("")

  const categoryDrawerDisclosure = useDisclosure<TechnicianCategory>()
  const deleteCategoryDisclosure = useDisclosure<TechnicianCategory>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_MECHANIC_FILTERS)

  // 1. Fetch Technicians
  const { data: technicians = [], isLoading: isLoadingTechnicians } = useQuery({
    queryKey: ["technicians", filter],
    queryFn: async () => {
      return technicianService.getTechnicians({
        search: filter.search || undefined,
        verificationStatus: filter.verificationStatus || undefined,
        availabilityStatus: filter.availabilityStatus || undefined,
      })
    },
    enabled: activeTab === "mechanics",
  })

  // 2. Fetch Categories & Catalog Services
  const { data: categories = [] } = useQuery({
    queryKey: ["technician-categories"],
    queryFn: async () => {
      return technicianService.getCategories(true)
    },
    enabled: activeTab === "categories" || categoryDrawerDisclosure.isOpen,
  })

  // 3. Fetch Technician Bookings
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["technician-bookings"],
    queryFn: async () => {
      return technicianService.getBookings({ limit: 50 })
    },
    enabled: activeTab === "bookings",
  })
  const bookings = bookingsData?.data || []

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: (id: string) => technicianService.verifyTechnician(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicians"] })
      drawerDisclosure.onClose()
      toast.success(
        "Technician / Mechanic verified and activated successfully!"
      )
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to verify technician")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      technicianService.rejectTechnician(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicians"] })
      rejectDisclosure.onClose()
      setRejectReason("")
      toast.success("Technician application rejected")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject technician")
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => technicianService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technician-categories"] })
      deleteCategoryDisclosure.onClose()
      toast.success("Category deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete category")
    },
  })

  const deleteTechnicianMutation = useMutation({
    mutationFn: (id: string) => technicianService.deleteTechnician(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicians"] })
      deleteTechnicianDisclosure.onClose()
      toast.success("Technician profile deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete technician profile")
    },
  })

  const handleOpenMechanic = (technician: Technician | null = null) => {
    drawerDisclosure.onOpen(
      technician ? { ...technician, viewMode: true } : null
    )
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter(updates)
    },
    [handleFilter]
  )

  // Columns: Technicians
  const mechanicColumns: Column<Technician>[] = useMemo(() => {
    return [
      {
        header: "Technician & Workshop",
        accessorKey: "workshopName",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 font-bold text-amber-600">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {row.user?.name || "Mechanic"}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {row.workshopName || "Independent Workshop"}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Contact & Phone",
        accessorKey: "userId",
        cell: (row) => (
          <div className="text-xs">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {row.user?.phone || "—"}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {row.user?.email || "—"}
            </div>
          </div>
        ),
      },
      {
        header: "Base Area & Radius",
        accessorKey: "baseArea",
        cell: (row) => (
          <div className="text-xs">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {row.baseArea || "General Area"}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Radius: {row.serviceRadiusKm ?? 15} km
            </div>
          </div>
        ),
      },
      {
        header: "Vehicle & Exp",
        accessorKey: "experienceYears",
        cell: (row) => (
          <div className="text-xs">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {row.experienceYears || "3-5 years"}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {row.vehicleType || "Service Bike"}
            </div>
          </div>
        ),
      },
      {
        header: "Status",
        accessorKey: "verificationStatus",
        cell: (row) => {
          const status = row.verificationStatus || "PENDING"
          return <StatusBadge status={status} />
        },
      },
      {
        header: "Actions",
        cell: (row) => (
          <div className="flex items-center gap-1.5">
            {row.verificationStatus === "PENDING" && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                  onClick={() => verifyMutation.mutate(row.id)}
                  title="Verify & Activate"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-500/10 hover:text-red-700"
                  onClick={() => rejectDisclosure.onOpen(row)}
                  title="Reject Registration"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => handleOpenMechanic(row)}
              title="View Profile"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-500/10 hover:text-red-700"
              onClick={() => deleteTechnicianDisclosure.onOpen(row)}
              title="Delete Technician"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ]
  }, [verifyMutation, rejectDisclosure, deleteTechnicianDisclosure])

  // Columns: Bookings
  const bookingColumns: Column<any>[] = useMemo(() => {
    return [
      {
        header: "Booking #",
        accessorKey: "bookingNumber",
        cell: (row) => (
          <div>
            <div className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
              {row.bookingNumber}
            </div>
            <div className="text-[11px] text-slate-500">
              {new Date(row.createdAt).toLocaleDateString()}
            </div>
          </div>
        ),
      },
      {
        header: "Customer & Vehicle",
        accessorKey: "user.name",
        cell: (row) => (
          <div className="text-xs">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {row.user?.name || "Customer"}
            </div>
            <div className="text-[11px] text-slate-500">
              {row.vehicleMakeModel || row.vehicleType} •{" "}
              {row.vehiclePlateNumber || "No Plate"}
            </div>
          </div>
        ),
      },
      {
        header: "Flow & Service",
        accessorKey: "bookingType",
        cell: (row) => {
          const isCustom = row.bookingType === "CUSTOM_INSPECTION"
          return (
            <div>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  isCustom
                    ? "border border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300"
                    : "border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                }`}
              >
                {isCustom ? (
                  <HelpCircle className="h-3 w-3" />
                ) : (
                  <Wrench className="h-3 w-3" />
                )}
                {isCustom ? "Inspection / Quote" : "Fixed Service"}
              </span>
              <div className="mt-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                {row.serviceCatalogItem?.name ||
                  row.category?.name ||
                  "Diagnostic Scan"}
              </div>
            </div>
          )
        },
      },
      {
        header: "Assigned Mechanic",
        accessorKey: "technicianProfile.workshopName",
        cell: (row) => (
          <div className="text-xs">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {row.technicianProfile?.user?.name || "Searching..."}
            </div>
            <div className="text-[11px] text-slate-500">
              {row.technicianProfile?.workshopName || "Unassigned"}
            </div>
          </div>
        ),
      },
      {
        header: "Financials (Split)",
        accessorKey: "quotedAmount",
        cell: (row) => (
          <div className="space-y-0.5 text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              Total Quote: ₹{row.quotedAmount || 0}
            </div>
            <div className="text-[10px] font-semibold text-emerald-600">
              Advance Paid: ₹{row.advanceAmount || 0} (
              {row.adminCommissionPercentage}%)
            </div>
            <div className="text-[10px] font-semibold text-indigo-600">
              Remaining: ₹{row.remainingAmount || 0}
            </div>
          </div>
        ),
      },
      {
        header: "Status & OTP",
        cell: (row) => (
          <div>
            <StatusBadge status={row.status} />
            <div className="mt-1 text-[10px] text-slate-500">
              Start: <span className="font-mono font-bold">{row.startOtp}</span>{" "}
              | End:{" "}
              <span className="font-mono font-bold">{row.completionOtp}</span>
            </div>
          </div>
        ),
      },
    ]
  }, [])

  return (
    <div className="space-y-6">
      {/* Technician Drawer */}
      <TechnicianDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        technician={drawerDisclosure.data}
        onVerify={(id) => verifyMutation.mutate(id)}
        isVerifying={verifyMutation.isPending}
      />

      {/* Category Drawer */}
      <TechnicianCategoryDrawer
        open={categoryDrawerDisclosure.isOpen}
        onClose={categoryDrawerDisclosure.onClose}
        category={categoryDrawerDisclosure.data}
      />

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        open={deleteCategoryDisclosure.isOpen}
        onOpenChange={deleteCategoryDisclosure.onClose}
        title="Delete Service Category"
        description={`Are you sure you want to delete category "${deleteCategoryDisclosure.data?.name}"?`}
        onConfirm={() =>
          deleteCategoryMutation.mutate(deleteCategoryDisclosure.data?.id || "")
        }
        isLoading={deleteCategoryMutation.isPending}
        confirmText="Delete Category"
        variant="danger"
      />

      {/* Reject Technician Confirmation */}
      <ConfirmDialog
        open={rejectDisclosure.isOpen}
        onOpenChange={rejectDisclosure.onClose}
        title="Reject Technician Registration"
        description={`Reject registration for "${rejectDisclosure.data?.user?.name || rejectDisclosure.data?.workshopName}"?`}
        onConfirm={() =>
          rejectMutation.mutate({
            id: rejectDisclosure.data?.id || "",
            reason:
              rejectReason ||
              "Qualifications or trade license could not be confirmed",
          })
        }
        isLoading={rejectMutation.isPending}
        confirmText="Reject Registration"
        variant="danger"
      />

      {/* Delete Technician Confirmation */}
      <ConfirmDialog
        open={deleteTechnicianDisclosure.isOpen}
        onOpenChange={deleteTechnicianDisclosure.onClose}
        title="Delete Technician Profile"
        description={`Are you sure you want to permanently delete technician "${deleteTechnicianDisclosure.data?.user?.name || deleteTechnicianDisclosure.data?.workshopName || "Technician"}"? This will remove all their service offerings and revoke technician privileges.`}
        onConfirm={() =>
          deleteTechnicianMutation.mutate(
            deleteTechnicianDisclosure.data?.id || ""
          )
        }
        isLoading={deleteTechnicianMutation.isPending}
        confirmText="Delete Technician"
        variant="danger"
      />

      {/* Header & Mode Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Roadside Mechanics & Breakdown Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage partner mechanics, service catalog categories, custom
            pricing, and roadside quotations
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("mechanics")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "mechanics"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            Mechanic Partners
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "categories"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Categories & Services
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "bookings"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Bookings & Quotes
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: MECHANIC PARTNERS ==================== */}
      {activeTab === "mechanics" && (
        <SectionCard
          title="Verified & Partner Mechanics"
          description="Review applications, verify trade qualifications, and monitor availability of registered breakdown technicians"
        >
          <div className="space-y-4">
            <FilterBar
              values={{
                search: filter.search || "",
                verificationStatus: filter.verificationStatus || "",
              }}
              onChange={handleFilterChange}
            >
              <FilterBar.Search
                name="search"
                placeholder="Search by mechanic name, workshop, or phone..."
                className="w-[300px]"
              />
              <FilterBar.Select
                name="verificationStatus"
                placeholder="All Verification States"
                options={[
                  { label: "All Verification States", value: "" },
                  { label: "Pending Verification", value: "PENDING" },
                  { label: "Verified & Active", value: "VERIFIED" },
                  { label: "Rejected", value: "REJECTED" },
                ]}
                className="w-48"
              />
            </FilterBar>

            <DataTable
              columns={mechanicColumns}
              data={technicians}
              isLoading={isLoadingTechnicians}
            />
          </div>
        </SectionCard>
      )}

      {/* ==================== TAB 2: CATEGORIES & CATALOG SERVICES ==================== */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Service Categories & Master Catalog
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Categories and catalog items are created by admin. When
                mechanics register, they choose which services to offer and
                define their own custom rates.
              </p>
            </div>

            <Button
              onClick={() => categoryDrawerDisclosure.onOpen(null)}
              className="flex items-center gap-1.5 bg-amber-600 text-xs font-semibold text-white hover:bg-amber-700"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-slate-900 ${
                  cat.isOther
                    ? "border-purple-500/40 bg-gradient-to-br from-purple-500/5 to-transparent dark:border-purple-500/30"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Category Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold ${
                        cat.isOther
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {cat.isOther ? (
                        <HelpCircle className="h-6 w-6" />
                      ) : (
                        <Wrench className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {cat.name}
                        </h4>
                        {cat.isOther ? (
                          <span className="rounded-full border border-purple-500/20 bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
                            Custom Quote / Inspection
                          </span>
                        ) : (
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                            {/* Fixed Rate: ₹{cat.basePrice} */}
                            Fixed Rate
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            cat.isActive
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {cat.description ||
                          "Roadside breakdown service category"}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Display Order: #{cat.displayOrder ?? 0}</span>
                        <span>•</span>
                        <span>Advance Commission: 20%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-slate-300 text-xs dark:border-slate-700"
                      onClick={() =>
                        categoryDrawerDisclosure.onOpen({
                          ...cat,
                          viewMode: false,
                        })
                      }
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-500/10"
                      onClick={() => deleteCategoryDisclosure.onOpen(cat)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: BOOKINGS & QUOTES ==================== */}
      {activeTab === "bookings" && (
        <SectionCard
          title="Roadside Assistance Bookings & Quotations"
          description="Monitor incoming technician dispatches, inspection quotes submitted by mechanics, advance commissions collected, and balance settlements"
        >
          <DataTable
            columns={bookingColumns}
            data={bookings}
            isLoading={isLoadingBookings}
          />
        </SectionCard>
      )}
    </div>
  )
}

export default MechanicsPage
