import { useState, useCallback, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus,
  Pencil,
  Eye,
  Trash2,
  Sparkles,
  Grid,
  Bus as BusIcon,
  Layers,
  LayoutGrid,
  CheckCircle2,
  EyeOff,
  RotateCcw,
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
import { PermissionGate } from "@/components/common/PermissionGate"

import { seatService } from "@/services/seatService"
import { busService } from "@/services/busService"
import { queryKeys } from "@/lib/queryKeys"
import { INITIAL_SEAT_FILTERS } from "@/constants/page/super-admin/seats"
import SeatDrawer from "@/components/dialog/SeatsDialog"
import GenerateLayoutDialog from "@/components/dialog/GenerateLayoutDialog"
import type { Seat } from "@/types/bus"

export const SeatsPage = () => {
  const queryClient = useQueryClient()

  // Bus Selection state
  const [selectedBusId, setSelectedBusId] = useState<string>("")
  const [activeDeckTab, setActiveDeckTab] = useState<"ALL" | "LOWER" | "UPPER">("ALL")
  const [viewMode, setViewMode] = useState<"MATRIX" | "TABLE">("MATRIX")

  // Disclosures
  const drawerDisclosure = useDisclosure<any>()
  const generateDisclosure = useDisclosure<any>()
  const deleteDisclosure = useDisclosure<any>()
  const clearBusDisclosure = useDisclosure<any>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_SEAT_FILTERS)

  // Fetch all buses for selection
  const { data: buses = [], isLoading: isLoadingBuses } = useQuery({
    queryKey: queryKeys.buses.all,
    queryFn: () => busService.getBuses(),
  })

  // Auto-select first bus if none selected
  useEffect(() => {
    if (!selectedBusId && buses.length > 0) {
      setSelectedBusId(buses[0].id)
    }
  }, [buses, selectedBusId])

  const selectedBus = useMemo(
    () => buses.find((b) => b.id === selectedBusId) || null,
    [buses, selectedBusId]
  )

  // Fetch seats for selected bus
  const { data: seats = [], isLoading: isLoadingSeats } = useQuery({
    queryKey: queryKeys.seats.byBus(selectedBusId),
    queryFn: () => seatService.getSeatsByBusId(selectedBusId),
    enabled: !!selectedBusId,
  })

  // Single seat delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => seatService.deleteSeat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seats.all })
      if (selectedBusId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.seats.byBus(selectedBusId),
        })
      }
      deleteDisclosure.onClose()
      toast.success("Seat deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete seat")
    },
  })

  // Clear all seats for bus mutation
  const clearBusMutation = useMutation({
    mutationFn: (busId: string) => seatService.deleteSeatsByBus(busId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seats.all })
      if (selectedBusId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.seats.byBus(selectedBusId),
        })
      }
      clearBusDisclosure.onClose()
      toast.success("Bus seat layout cleared successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to clear bus seats")
    },
  })

  const handleOpen = (
    seat: Seat | null = null,
    mode: "create" | "edit" | "view" = "create"
  ) => {
    drawerDisclosure.onOpen(
      seat ? { ...seat, viewMode: mode === "view" } : null
    )
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter({ ...updates, page: 1 })
    },
    [handleFilter]
  )

  // Filtered seats for matrix & table
  const filteredSeats = useMemo(() => {
    return seats.filter((s) => {
      // Search term filter
      if (
        filter.search &&
        !s.seatNumber.toLowerCase().includes(filter.search.toLowerCase())
      ) {
        return false
      }
      // Deck tab filter
      if (activeDeckTab !== "ALL" && s.deck !== activeDeckTab) {
        return false
      }
      // FilterBar deck filter
      if (filter.deck && filter.deck !== "ALL" && s.deck !== filter.deck) {
        return false
      }
      // FilterBar seatType filter
      if (
        filter.seatType &&
        filter.seatType !== "ALL" &&
        s.seatType !== filter.seatType &&
        s.type !== filter.seatType
      ) {
        return false
      }
      return true
    })
  }, [seats, filter.search, filter.deck, filter.seatType, activeDeckTab])

  // Stats calculation
  const lowerCount = useMemo(
    () => seats.filter((s) => s.deck === "LOWER").length,
    [seats]
  )
  const upperCount = useMemo(
    () => seats.filter((s) => s.deck === "UPPER").length,
    [seats]
  )
  const windowCount = useMemo(
    () => seats.filter((s) => s.isWindowSeat).length,
    [seats]
  )

  // Matrix grouping by deck and row
  const deckSeatsMatrix = useMemo(() => {
    const targetDeck = activeDeckTab === "ALL" ? "LOWER" : activeDeckTab
    const deckSeats = seats.filter((s) => s.deck === targetDeck)

    // Group by row
    const rowMap: Record<number, Seat[]> = {}
    deckSeats.forEach((s) => {
      const r = s.row || 1
      if (!rowMap[r]) rowMap[r] = []
      rowMap[r].push(s)
    })

    // Sort rows ascending and columns ascending inside each row
    const rows = Object.keys(rowMap)
      .map(Number)
      .sort((a, b) => a - b)

    rows.forEach((r) => {
      rowMap[r].sort((a, b) => (a.column || 0) - (b.column || 0))
    })

    return { rows, rowMap, targetDeck }
  }, [seats, activeDeckTab])

  const columns: Column<Seat>[] = useMemo(() => {
    return [
      {
        header: "Seat Number",
        accessorKey: "seatNumber",
        cell: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-10 items-center justify-center rounded-lg bg-indigo-500/10 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {row.seatNumber}
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                Seat {row.seatNumber}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                ID: {row.id.slice(0, 8)}...
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Deck",
        cell: (row) => (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
              row.deck === "UPPER"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
            }`}
          >
            {row.deck} DECK
          </span>
        ),
      },
      {
        header: "Seat Type",
        cell: (row) => {
          const type = row.seatType || row.type || "SEATER"
          return (
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                type === "SLEEPER"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : type === "SEMI_SLEEPER"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              }`}
            >
              {type}
            </span>
          )
        },
      },
      {
        header: "Grid (Row / Col)",
        cell: (row) => (
          <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
            Row {row.row}, Col {row.column}
          </span>
        ),
      },
      {
        header: "Attributes",
        cell: (row) => (
          <div className="flex flex-wrap gap-1 text-[11px]">
            {row.isWindowSeat && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Window
              </span>
            )}
            {row.isAisleSeat && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Aisle
              </span>
            )}
            {row.isLastRow && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Rear
              </span>
            )}
          </div>
        ),
      },
      {
        header: "Visibility",
        cell: (row) => (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              row.isVisible !== false
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-500"
            }`}
          >
            {row.isVisible !== false ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> Visible
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Hidden
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

            <PermissionGate resource="seats" action="manage">
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
            </PermissionGate>
          </div>
        ),
      },
    ]
  }, [deleteDisclosure])

  return (
    <div className="space-y-6">
      {/* Seat Drawer */}
      <SeatDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        seat={drawerDisclosure.data}
        defaultBusId={selectedBusId}
      />

      {/* Preset Layout Generator Modal */}
      <GenerateLayoutDialog
        open={generateDisclosure.isOpen}
        onClose={generateDisclosure.onClose}
        selectedBus={selectedBus}
      />

      {/* Single Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteDisclosure.isOpen}
        onOpenChange={deleteDisclosure.onClose}
        title="Delete Physical Seat"
        description={`Are you sure you want to delete seat "${deleteDisclosure.data?.seatNumber}"?`}
        onConfirm={() => deleteMutation.mutate(deleteDisclosure.data?.id)}
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        variant="danger"
      />

      {/* Clear Bus Seats Confirm Dialog */}
      <ConfirmDialog
        open={clearBusDisclosure.isOpen}
        onOpenChange={clearBusDisclosure.onClose}
        title="Clear Entire Bus Seating Layout"
        description={`Are you sure you want to remove ALL physical seats for bus "${selectedBus?.busName}" (${selectedBus?.registrationNumber})?`}
        onConfirm={() => clearBusMutation.mutate(selectedBusId)}
        isLoading={clearBusMutation.isPending}
        confirmText="Clear All Seats"
        variant="danger"
      />

      {/* Header & Bus Vehicle Selection */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Physical Seat Layout Builder
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure vehicle deck matrices, seat categories, and physical seating positions.
          </p>
        </div>

        <PermissionGate resource="seats" action="manage">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => generateDisclosure.onOpen()}
              disabled={!selectedBusId}
              className="gap-1.5 text-xs font-semibold"
            >
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Generate Preset
            </Button>

            <Button
              onClick={() => handleOpen()}
              disabled={!selectedBusId}
              className="gap-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Add Custom Seat
            </Button>
          </div>
        </PermissionGate>
      </div>

      {/* Vehicle Selection & Specs Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BusIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Vehicle Fleet
              </label>
              <select
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(e.target.value)}
                disabled={isLoadingBuses}
                className="block min-w-[240px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                {buses.length === 0 && <option value="">No buses registered</option>}
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.busName} ({b.registrationNumber}) — Cap: {b.seatingCapacity || 36}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Telemetry Stats */}
          {selectedBus && (
            <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 sm:grid-cols-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 dark:border-slate-800">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Configured Seats</span>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {seats.length} / {selectedBus.seatingCapacity || 36}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Lower / Upper Deck</span>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {lowerCount} L / {upperCount} U
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Window Seats</span>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {windowCount} Seats
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Bus Type</span>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {selectedBus.busType || "SEATER"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area: Matrix / Table View Toggle */}
      <SectionCard
        title="Physical Seat Matrix & Management"
        description="Inspect cabin grid layouts, toggle seat attributes, or edit matrix parameters"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950">
              <Button
                size="sm"
                variant={viewMode === "MATRIX" ? "default" : "ghost"}
                onClick={() => setViewMode("MATRIX")}
                className="h-7 gap-1 px-2.5 text-[11px]"
              >
                <Grid className="h-3.5 w-3.5" /> Matrix Grid
              </Button>
              <Button
                size="sm"
                variant={viewMode === "TABLE" ? "default" : "ghost"}
                onClick={() => setViewMode("TABLE")}
                className="h-7 gap-1 px-2.5 text-[11px]"
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Data Table
              </Button>
            </div>

            {seats.length > 0 && (
              <PermissionGate resource="seats" action="manage">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => clearBusDisclosure.onOpen()}
                  className="h-8 gap-1 border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Clear Layout
                </Button>
              </PermissionGate>
            )}
          </div>
        }
      >
        <div className="space-y-5">
          {/* Deck Tabs & Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Deck Selector Tabs */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-950">
              <button
                onClick={() => setActiveDeckTab("ALL")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  activeDeckTab === "ALL"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                All Seats ({seats.length})
              </button>
              <button
                onClick={() => setActiveDeckTab("LOWER")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  activeDeckTab === "LOWER"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Lower Deck ({lowerCount})
              </button>
              <button
                onClick={() => setActiveDeckTab("UPPER")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  activeDeckTab === "UPPER"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Upper Deck ({upperCount})
              </button>
            </div>

            {/* Filter Bar */}
            <FilterBar
              values={{ search: filter.search || "", seatType: filter.seatType || "" }}
              onChange={handleFilterChange}
            >
              <FilterBar.Search
                name="search"
                placeholder="Search seat number..."
                className="w-[200px]"
              />
              <FilterBar.Select
                name="seatType"
                placeholder="All Seat Types"
                options={[
                  { label: "All Types", value: "ALL" },
                  { label: "Seater", value: "SEATER" },
                  { label: "Sleeper", value: "SLEEPER" },
                  { label: "Semi-Sleeper", value: "SEMI_SLEEPER" },
                ]}
                className="w-[150px]"
              />
            </FilterBar>
          </div>

          {/* Render Visual Matrix Mode */}
          {viewMode === "MATRIX" ? (
            <div className="space-y-4">
              {isLoadingSeats ? (
                <div className="flex h-48 items-center justify-center text-xs text-slate-500">
                  Loading bus seating layout matrix...
                </div>
              ) : seats.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-800">
                  <Layers className="h-10 w-10 text-slate-400" />
                  <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    No Physical Seats Configured
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    No physical seats have been created for vehicle {selectedBus?.busName || "this bus"}. Generate a preset or add seats manually.
                  </p>
                  <PermissionGate resource="seats" action="manage">
                    <Button
                      onClick={() => generateDisclosure.onOpen()}
                      className="mt-4 gap-2 text-xs font-semibold"
                    >
                      <Sparkles className="h-4 w-4" /> Generate Preset Layout
                    </Button>
                  </PermissionGate>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 dark:border-slate-800 dark:bg-slate-950/40">
                  {/* Bus Cabin Frame */}
                  <div className="mx-auto max-w-2xl">
                    {/* Front Cabin Driver Wheel */}
                    <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-300 bg-white px-5 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        <BusIcon className="h-4 w-4 text-indigo-500" />
                        Front Cabin ({deckSeatsMatrix.targetDeck} DECK)
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <span>Driver Cabin</span>
                      </div>
                    </div>

                    {/* Matrix Row Rows */}
                    <div className="space-y-3">
                      {deckSeatsMatrix.rows.map((rowNum) => {
                        const rowSeats = deckSeatsMatrix.rowMap[rowNum] || []
                        return (
                          <div
                            key={rowNum}
                            className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
                          >
                            <span className="w-10 flex-shrink-0 text-center font-mono text-xs font-bold text-slate-400">
                              R{rowNum}
                            </span>

                            <div className="grid flex-1 grid-cols-4 gap-3 sm:grid-cols-4">
                              {rowSeats.map((seat) => {
                                const type = seat.seatType || seat.type || "SEATER"
                                return (
                                  <div
                                    key={seat.id}
                                    className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all ${
                                      seat.isVisible !== false
                                        ? type === "SLEEPER"
                                          ? "border-indigo-300 bg-indigo-50/50 hover:border-indigo-500 dark:border-indigo-900/60 dark:bg-indigo-950/20"
                                          : type === "SEMI_SLEEPER"
                                          ? "border-amber-300 bg-amber-50/50 hover:border-amber-500 dark:border-amber-900/60 dark:bg-amber-950/20"
                                          : "border-emerald-300 bg-emerald-50/50 hover:border-emerald-500 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                                        : "border-slate-200 bg-slate-100 opacity-60 dark:border-slate-800 dark:bg-slate-900"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                                        {seat.seatNumber}
                                      </span>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {type.slice(0, 3)}
                                      </span>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between">
                                      <div className="flex gap-1 text-[10px] font-semibold text-slate-500">
                                        {seat.isWindowSeat && <span>W</span>}
                                        {seat.isAisleSeat && <span>A</span>}
                                      </div>

                                      <div className="flex items-center gap-1 opacity-90 transition group-hover:opacity-100">
                                        <button
                                          onClick={() => handleOpen(seat, "view")}
                                          title="View seat details"
                                          className="p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </button>
                                        <PermissionGate resource="seats" action="manage">
                                          <button
                                            onClick={() => handleOpen(seat, "edit")}
                                            title="Edit seat"
                                            className="p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </button>
                                        </PermissionGate>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Bus Rear Indicator */}
                    <div className="mt-6 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Rear of Vehicle
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Render Data Table Mode */
            <DataTable
              columns={columns}
              data={filteredSeats}
              isLoading={isLoadingSeats}
            />
          )}
        </div>
      </SectionCard>
    </div>
  )
}

export default SeatsPage
