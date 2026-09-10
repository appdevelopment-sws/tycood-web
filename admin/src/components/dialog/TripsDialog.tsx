import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import {
  FormField,
  FormSelectField,
} from "@/components/ui/form-fields"
import { queryKeys } from "@/lib/queryKeys"
import { tripService, type CreateTripPayload } from "@/services/tripService"
import { busService } from "@/services/busService"
import { routeService } from "@/services/routeService"
import { driverService } from "@/services/driverService"
import type { Trip } from "@/types/bus"
import sectionHeader from "@/components/sectionHeader"
import { TRIP_FORM_INITIAL_DATA } from "@/constants/page/super-admin/trips"

export interface TripsDialogProps {
  open: boolean
  onClose: (open: boolean) => void
  trip?: (Trip & { viewMode?: boolean; busId?: string; routeId?: string; driverId?: string; scheduleId?: string }) | null
}

export default function TripsDialog({
  open,
  onClose,
  trip,
}: TripsDialogProps) {
  const isViewMode = !!trip?.viewMode
  const isEditMode = !!trip?.id
  const tripId = trip?.id

  const { handleSubmit, control, reset } = useForm<CreateTripPayload>({
    defaultValues: TRIP_FORM_INITIAL_DATA,
    mode: "onChange",
  })

  // Fetch Buses list
  const { data: buses = [] } = useQuery({
    queryKey: queryKeys.buses.all,
    queryFn: () => busService.getBuses(),
    enabled: open,
  })

  // Fetch Routes list
  const { data: routesResponse } = useQuery({
    queryKey: queryKeys.routes.all,
    queryFn: () => routeService.getRoutes(),
    enabled: open,
  })
  const routes = Array.isArray(routesResponse) ? routesResponse : []

  // Fetch Drivers list
  const { data: drivers = [] } = useQuery({
    queryKey: queryKeys.drivers.all,
    queryFn: () => driverService.getDrivers(),
    enabled: open,
  })

  const busOptions = buses.map((b) => ({
    label: `${b.registrationNumber} - ${b.busName} (${b.seatingCapacity} Seats)`,
    value: b.id,
  }))

  const routeOptions = routes.map((r: any) => ({
    label: r.name || `${r.originCity || r.sourceStation?.city} → ${r.destinationCity || r.destinationStation?.city}`,
    value: r.id,
  }))

  const driverOptions = [
    { label: "Unassigned", value: "" },
    ...drivers.map((d) => ({
      label: `${d.name} (${d.phone})`,
      value: d.id,
    })),
  ]

  const statusOptions = [
    { label: "Scheduled", value: "SCHEDULED" },
    { label: "In Transit / On Time", value: "IN_TRANSIT" },
    { label: "Delayed", value: "DELAYED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Completed", value: "COMPLETED" },
  ]

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        // Format ISO date strings for datetime-local inputs (YYYY-MM-DDTHH:mm)
        const formatForInput = (isoStr?: string) => {
          if (!isoStr) return ""
          try {
            const d = new Date(isoStr)
            if (isNaN(d.getTime())) return ""
            return d.toISOString().slice(0, 16)
          } catch {
            return ""
          }
        }

        reset({
          busId: trip?.busId ?? "",
          routeId: trip?.routeId ?? "",
          driverId: trip?.driverId ?? (trip as any)?.driver?.id ?? "",
          scheduleId: trip?.scheduleId ?? "",
          tripCode: trip?.tripCode ?? "",
          departureTime: formatForInput(trip?.departureTime),
          arrivalTime: formatForInput(trip?.arrivalTime),
          minFare: Number(trip?.farePrice) || 500,
          status: trip?.status ?? "SCHEDULED",
        })
      } else {
        reset(TRIP_FORM_INITIAL_DATA)
      }
    }
  }, [open, trip, reset, isEditMode, isViewMode])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateTripPayload) =>
      isEditMode && tripId
        ? tripService.updateTrip(tripId, data)
        : tripService.createTrip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.all,
      })
      toast.success(
        isEditMode
          ? "Trip dispatch updated successfully"
          : "New trip scheduled successfully"
      )
      reset()
      onClose(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save trip schedule")
    },
  })

  const onSubmit: SubmitHandler<CreateTripPayload> = (data) => {
    const depIso = data.departureTime ? new Date(data.departureTime).toISOString() : new Date().toISOString()
    const arrIso = data.arrivalTime ? new Date(data.arrivalTime).toISOString() : new Date(Date.now() + 14400000).toISOString()

    const payload: CreateTripPayload = {
      busId: data.busId,
      routeId: data.routeId,
      driverId: data.driverId ? data.driverId : null,
      scheduleId: data.scheduleId ? data.scheduleId : null,
      tripCode: data.tripCode?.trim() || undefined,
      departureTime: depIso,
      arrivalTime: arrIso,
      minFare: Number(data.minFare) || 0,
      status: data.status,
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
          ? "View Trip Details"
          : isEditMode
          ? "Edit Trip Schedule"
          : "Schedule New Trip"
      }
      description={
        isViewMode
          ? "Viewing detailed trip schedule, bus assignment, and occupancy."
          : isEditMode
          ? "Update trip timing, assigned driver, status, and fare."
          : "Dispatch a new bus trip by selecting bus, route, schedule, and driver."
      }
      size="lg"
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
              form="trip-form"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Update Trip"
                : "Schedule Trip"}
            </Button>
          )}
        </div>
      }
    >
      <form
        id="trip-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {/* Section 01: Route & Bus Assignment */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("01", "Route & Bus Assignment")}

          <div className="grid gap-6 sm:grid-cols-2">
            <FormSelectField
              control={control}
              name="routeId"
              label="SELECT ROUTE"
              placeholder="Select assigned route..."
              options={routeOptions}
              required
              disabled={isViewMode}
            />

            <FormSelectField
              control={control}
              name="busId"
              label="SELECT BUS"
              placeholder="Select assigned bus..."
              options={busOptions}
              required
              disabled={isViewMode}
            />

            <FormSelectField
              control={control}
              name="driverId"
              label="ASSIGN DRIVER"
              placeholder="Select driver..."
              options={driverOptions}
              disabled={isViewMode}
            />

            <FormField
              control={control}
              name="tripCode"
              label="TRIP CODE (OPTIONAL)"
              placeholder="e.g. TRIP-20260801-01"
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Section 02: Schedule & Pricing */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("02", "Timing & Pricing Details")}

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={control}
              name="departureTime"
              label="DEPARTURE TIME"
              type="datetime-local"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="arrivalTime"
              label="ESTIMATED ARRIVAL TIME"
              type="datetime-local"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="minFare"
              label="BASE FARE ($ / ₹)"
              type="number"
              placeholder="e.g. 500"
              required
              readOnly={isViewMode}
            />

            <FormSelectField
              control={control}
              name="status"
              label="LIVE TRIP STATUS"
              options={statusOptions}
              disabled={isViewMode}
            />
          </div>
        </div>
      </form>
    </FormContainer>
  )
}
