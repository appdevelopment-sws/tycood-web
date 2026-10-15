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
  Clock,
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
  type TechnicianServiceCatalogItem,
} from "@/services/technicianService"
import TechnicianDrawer from "@/components/dialog/TechnicianDrawer"
import TechnicianCategoryDrawer from "@/components/dialog/TechnicianCategoryDrawer"
import TechnicianServiceDrawer from "@/components/dialog/TechnicianServiceDrawer"

const INITIAL_MECHANIC_FILTERS = {
  search: "",
  verificationStatus: "",
  availabilityStatus: "",
}

export const MechanicsPage = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"mechanics" | "categories" | "bookings">("mechanics")

  // Disclosures
  const drawerDisclosure = useDisclosure<Technician>()
  const rejectDisclosure = useDisclosure<Technician>()
  const [rejectReason, setRejectReason] = useState("")

  const categoryDrawerDisclosure = useDisclosure<TechnicianCategory>()
  const serviceDrawerDisclosure = useDisclosure<TechnicianServiceCatalogItem>()
  const [selectedDefaultCatId, setSelectedDefaultCatId] = useState<string | undefined>()

  const deleteCategoryDisclosure = useDisclosure<TechnicianCategory>()
  const deleteServiceDisclosure = useDisclosure<TechnicianServiceCatalogItem>()

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
    enabled: activeTab === "categories" || categoryDrawerDisclosure.isOpen || serviceDrawerDisclosure.isOpen,
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
      toast.success("Technician / Mechanic verified and activated successfully!")
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

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => technicianService.deleteServiceItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technician-categories"] })
      deleteServiceDisclosure.onClose()
      toast.success("Service item deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete service item")
    },
  })

  const handleOpenMechanic = (technician: Technician | null = null) => {
    drawerDisclosure.onOpen(technician ? { ...technician, viewMode: true } : null)
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
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ]
  }, [verifyMutation, rejectDisclosure])

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
              {row.vehicleMakeModel || row.vehicleType} • {row.vehiclePlateNumber || "No Plate"}
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
                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                    : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                }`}
              >
                {isCustom ? <HelpCircle className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                {isCustom ? "Inspection / Quote" : "Fixed Service"}
              </span>
              <div className="mt-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                {row.serviceCatalogItem?.name || row.category?.name || "Diagnostic Scan"}
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
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              Total Quote: ₹{row.quotedAmount || 0}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">
              Advance Paid: ₹{row.advanceAmount || 0} ({row.adminCommissionPercentage}%)
            </div>
            <div className="text-[10px] text-indigo-600 font-semibold">
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
              Start: <span className="font-mono font-bold">{row.startOtp}</span> | End:{" "}
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

      {/* Service Catalog Item Drawer */}
      <TechnicianServiceDrawer
        open={serviceDrawerDisclosure.isOpen}
        onClose={serviceDrawerDisclosure.onClose}
        serviceItem={serviceDrawerDisclosure.data}
        categories={categories}
        defaultCategoryId={selectedDefaultCatId}
      />

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        open={deleteCategoryDisclosure.isOpen}
        onOpenChange={deleteCategoryDisclosure.onClose}
        title="Delete Service Category"
        description={`Are you sure you want to delete category "${deleteCategoryDisclosure.data?.name}"? All associated services will also be removed.`}
        onConfirm={() =>
          deleteCategoryMutation.mutate(deleteCategoryDisclosure.data?.id || "")
        }
        isLoading={deleteCategoryMutation.isPending}
        confirmText="Delete Category"
        variant="danger"
      />

      {/* Delete Service Item Confirmation */}
      <ConfirmDialog
        open={deleteServiceDisclosure.isOpen}
        onOpenChange={deleteServiceDisclosure.onClose}
        title="Delete Catalog Service Item"
        description={`Are you sure you want to delete service "${deleteServiceDisclosure.data?.name}"?`}
        onConfirm={() =>
          deleteServiceMutation.mutate(deleteServiceDisclosure.data?.id || "")
        }
        isLoading={deleteServiceMutation.isPending}
        confirmText="Delete Service"
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
            reason: rejectReason || "Qualifications or trade license could not be confirmed",
          })
        }
        isLoading={rejectMutation.isPending}
        confirmText="Reject Registration"
        variant="danger"
      />

      {/* Header & Mode Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Roadside Mechanics & Breakdown Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage partner mechanics, service catalog categories, custom pricing, and roadside quotations
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
                Categories and catalog items are created by admin. When mechanics register, they choose which services to offer and define their own custom rates.
              </p>
            </div>

            <Button
              onClick={() => categoryDrawerDisclosure.onOpen(null)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5"
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                        cat.isOther
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {cat.isOther ? (
                        <HelpCircle className="h-5 w-5" />
                      ) : (
                        <Wrench className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {cat.name}
                        </h4>
                        {cat.isOther && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-500/20">
                            Other / Inspection Flow
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            cat.isActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {cat.description || "No description provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 border-slate-300 dark:border-slate-700"
                      onClick={() => {
                        setSelectedDefaultCatId(cat.id)
                        serviceDrawerDisclosure.onOpen(null)
                      }}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add Service
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => categoryDrawerDisclosure.onOpen({ ...cat, viewMode: false })}
                    >
                      <Pencil className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
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

                {/* Services List */}
                <div className="mt-4">
                  <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-2">
                    Catalog Service Items ({cat.services?.length || 0})
                  </div>

                  {(!cat.services || cat.services.length === 0) ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
                      No services in this category yet. Click &quot;Add Service&quot; above to add catalog items.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {cat.services.map((srv) => (
                        <div
                          key={srv.id}
                          className="flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-amber-500/30 dark:border-slate-800/80 dark:bg-slate-950/40"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                                {srv.name}
                              </span>
                              {srv.isInspectionRequired && (
                                <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                                  Quote
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {srv.description || "Standard breakdown labor"}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <Clock className="h-3 w-3" />
                              ~{srv.estimatedDurationMinutes} mins
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setSelectedDefaultCatId(cat.id)
                                serviceDrawerDisclosure.onOpen({ ...srv, viewMode: false })
                              }}
                            >
                              <Pencil className="h-3 w-3 text-slate-500" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:bg-red-500/10"
                              onClick={() => deleteServiceDisclosure.onOpen(srv)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
