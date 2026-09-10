import { useEffect, useState } from "react"
import { useForm, Controller, type SubmitHandler } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Trash2, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import {
  FormField,
  FormSelectField,
} from "@/components/ui/form-fields"
import { queryKeys } from "@/lib/queryKeys"
import {
  routeService,
  type CreateRoutePayload,
  type RouteStopPayload,
} from "@/services/routeService"
import { stationService } from "@/services/stationService"
import type { Route } from "@/types/bus"
import sectionHeader from "@/components/sectionHeader"
import { ROUTE_FORM_INITIAL_DATA } from "@/constants/page/super-admin/routes"

export interface RouteDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  route?: (Route & { viewMode?: boolean }) | null
}

export default function RouteDrawer({
  open,
  onClose,
  route,
}: RouteDrawerProps) {
  const isViewMode = !!route?.viewMode
  const isEditMode = !!route?.id
  const routeId = route?.id

  const [stops, setStops] = useState<RouteStopPayload[]>([])

  const { handleSubmit, control, reset } = useForm<CreateRoutePayload>({
    defaultValues: ROUTE_FORM_INITIAL_DATA,
    mode: "onChange",
  })

  // Fetch stations for dropdowns
  const { data: stations = [] } = useQuery({
    queryKey: queryKeys.stations.all,
    queryFn: () => stationService.getStations(),
    enabled: open,
  })

  const stationOptions = stations.map((st) => ({
    label: `${st.name} (${st.city}, ${st.state || "India"})`,
    value: st.id,
  }))

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        reset({
          name: route?.name ?? route?.routeName ?? "",
          sourceStationId: route?.sourceStationId ?? route?.originStationId ?? "",
          destinationStationId: route?.destinationStationId ?? "",
          distanceKm: route?.distanceKm ?? 0,
          estimatedDurationMinutes:
            route?.estimatedDurationMinutes ??
            (route?.estimatedDurationHours ? Math.round(route.estimatedDurationHours * 60) : 0),
          isActive: route?.isActive ?? (route?.status === "INACTIVE" ? false : true),
        })

        if (route?.stops && Array.isArray(route.stops)) {
          setStops(
            route.stops.map((st, idx) => ({
              stationId: st.stationId,
              stopOrder: st.stopOrder || idx + 1,
              stopType: st.stopType || "BOTH",
              timeOffsetMinutes: st.timeOffsetMinutes || 0,
              fareMarkup: Number(st.fareMarkup) || 0,
            }))
          )
        } else {
          setStops([])
        }
      } else {
        reset(ROUTE_FORM_INITIAL_DATA)
        setStops([])
      }
    }
  }, [open, route, reset, isEditMode, isViewMode])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateRoutePayload) =>
      isEditMode && routeId
        ? routeService.updateRoute(routeId, data)
        : routeService.createRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.routes.all,
      })
      toast.success(
        isEditMode
          ? "Route corridor updated successfully"
          : "Route corridor created successfully"
      )
      reset()
      setStops([])
      onClose(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save route corridor")
    },
  })

  const handleAddStop = () => {
    if (isViewMode) return
    setStops((prev) => [
      ...prev,
      {
        stationId: "",
        stopOrder: prev.length + 1,
        stopType: "BOTH",
        timeOffsetMinutes: 30,
        fareMarkup: 0,
      },
    ])
  }

  const handleRemoveStop = (index: number) => {
    if (isViewMode) return
    setStops((prev) => {
      const filtered = prev.filter((_, i) => i !== index)
      return filtered.map((s, idx) => ({ ...s, stopOrder: idx + 1 }))
    })
  }

  const handleStopChange = (
    index: number,
    field: keyof RouteStopPayload,
    value: any
  ) => {
    setStops((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const onSubmit: SubmitHandler<CreateRoutePayload> = (data) => {
    if (data.sourceStationId === data.destinationStationId) {
      toast.error("Origin and Destination stations must be different")
      return
    }

    const payload: CreateRoutePayload = {
      name: data.name,
      sourceStationId: data.sourceStationId,
      destinationStationId: data.destinationStationId,
      distanceKm: Number(data.distanceKm) || 0,
      estimatedDurationMinutes: Number(data.estimatedDurationMinutes) || 0,
      isActive: Boolean(data.isActive),
      stops: stops
        .filter((s) => Boolean(s.stationId))
        .map((s, idx) => ({
          stationId: s.stationId,
          stopOrder: idx + 1,
          stopType: s.stopType || "BOTH",
          timeOffsetMinutes: Number(s.timeOffsetMinutes) || 0,
          fareMarkup: Number(s.fareMarkup) || 0,
        })),
    }

    mutation.mutate(payload)
  }

  return (
    <FormContainer
      variant="modal"
      open={open}
      onOpenChange={(isOpen) => onClose(isOpen)}
      title={
        isViewMode
          ? "View Route Corridor Details"
          : isEditMode
          ? "Edit Route Corridor"
          : "Create Route Corridor"
      }
      description={
        isViewMode
          ? "Viewing detailed transit corridor specifications and intermediate stops."
          : isEditMode
          ? "Update route corridor, stations, distance, and intermediate stops."
          : "Define a new transit corridor with origin, destination, and intermediate boarding/dropping points."
      }
      size="xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
            disabled={mutation.isPending}
          >
            {isViewMode ? "Close" : "Cancel"}
          </Button>

          {!isViewMode && (
            <Button
              type="submit"
              form="route-form"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Update Route"
                : "Create Route"}
            </Button>
          )}
        </div>
      }
    >
      <form
        id="route-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {/* Section 01: Route Corridor Details */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("01", "Route Corridor Details")}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                control={control}
                name="name"
                label="ROUTE NAME / CORRIDOR TITLE"
                placeholder="e.g. Delhi to Jaipur via NH48 Express"
                required
                readOnly={isViewMode}
              />
            </div>

            <FormSelectField
              control={control}
              name="sourceStationId"
              label="ORIGIN (SOURCE) STATION"
              placeholder="Select origin station..."
              options={stationOptions}
              required
              disabled={isViewMode}
            />

            <FormSelectField
              control={control}
              name="destinationStationId"
              label="DESTINATION STATION"
              placeholder="Select destination station..."
              options={stationOptions}
              required
              disabled={isViewMode}
            />

            <FormField
              control={control}
              name="distanceKm"
              label="DISTANCE (KM)"
              placeholder="e.g. 280.5"
              type="number"
              required
              readOnly={isViewMode}
            />

            <Controller
              control={control}
              name="estimatedDurationMinutes"
              rules={{ required: "Estimated duration is required" }}
              render={({ field, fieldState: { error } }) => {
                const mins = Number(field.value)
                const formattedHours =
                  mins && !isNaN(mins) && mins > 0
                    ? (() => {
                        const h = Math.floor(mins / 60)
                        const m = mins % 60
                        const dec = (mins / 60).toFixed(1)
                        if (h > 0 && m > 0) return `${h}h ${m}m (${dec} hrs)`
                        if (h > 0) return `${h} hrs`
                        return `${m} mins`
                      })()
                    : null

                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                        ESTIMATED DURATION (MINUTES) <span className="text-rose-500">*</span>
                      </label>
                      {formattedHours && (
                        <span className="flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400">
                          <Clock className="h-3 w-3" />
                          {formattedHours}
                        </span>
                      )}
                    </div>
                    <input
                      {...field}
                      type="number"
                      readOnly={isViewMode}
                      placeholder="e.g. 330"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:bg-slate-950"
                    />
                    {error && (
                      <p className="text-[11px] text-rose-500">{error.message}</p>
                    )}
                  </div>
                )
              }}
            />

            <FormSelectField
              control={control}
              name="isActive"
              label="ROUTE STATUS"
              options={[
                { label: "Active", value: true as any },
                { label: "Inactive", value: false as any },
              ]}
              disabled={isViewMode}
            />
          </div>
        </div>

        {/* Section 02: Intermediate Stops */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          <div className="flex items-center justify-between pb-4">
            <div>
              {sectionHeader("02", "Intermediate Boarding & Dropping Stops")}
            </div>

            {!isViewMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStop}
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Stop
              </Button>
            )}
          </div>

          {stops.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center text-xs text-slate-500 dark:border-slate-800">
              <MapPin className="mb-2 h-6 w-6 text-slate-400" />
              <span>No intermediate stops configured.</span>
              <span className="text-[11px] text-slate-400">
                This is a direct non-stop route from origin to destination.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {stops.map((stop, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-4 rounded-lg border bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:items-center"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 font-bold text-xs text-indigo-500">
                    {idx + 1}
                  </div>

                  <div className="grid flex-1 gap-3 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                        Station
                      </label>
                      <select
                        value={stop.stationId}
                        disabled={isViewMode}
                        onChange={(e) =>
                          handleStopChange(idx, "stationId", e.target.value)
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="">Select stop station...</option>
                        {stationOptions.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                        Stop Type
                      </label>
                      <select
                        value={stop.stopType}
                        disabled={isViewMode}
                        onChange={(e) =>
                          handleStopChange(idx, "stopType", e.target.value)
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="BOTH">Boarding & Dropping</option>
                        <option value="BOARDING">Boarding Only</option>
                        <option value="DROPPING">Dropping Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                        Offset (Mins)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={stop.timeOffsetMinutes}
                          readOnly={isViewMode}
                          onChange={(e) =>
                            handleStopChange(
                              idx,
                              "timeOffsetMinutes",
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <Clock className="absolute right-2 top-2 h-3.5 w-3.5 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {!isViewMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStop(idx)}
                      className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </FormContainer>
  )
}
