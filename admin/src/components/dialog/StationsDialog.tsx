import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import {
  FormField,
  FormSelectField,
} from "@/components/ui/form-fields"
import { queryKeys } from "@/lib/queryKeys"
import {
  stationService,
  type CreateStationPayload,
} from "@/services/stationService"
import type { Station } from "@/types/bus"
import sectionHeader from "@/components/sectionHeader"
import { STATION_FORM_INITIAL_DATA } from "@/constants/page/super-admin/stations"

export interface StationDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  station?: (Station & { viewMode?: boolean }) | null
}

export default function StationDrawer({
  open,
  onClose,
  station,
}: StationDrawerProps) {
  const isViewMode = !!station?.viewMode
  const isEditMode = !!station?.id
  const stationId = station?.id

  const { handleSubmit, control, reset } = useForm<CreateStationPayload>({
    defaultValues: STATION_FORM_INITIAL_DATA,
    mode: "onChange",
  })

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        reset({
          name: station?.name ?? "",
          city: station?.city ?? "",
          state: station?.state ?? "",
          terminalName: station?.terminalName ?? "",
          latitude: station?.latitude ?? 0,
          longitude: station?.longitude ?? 0,
          isActive: station?.isActive ?? true,
        })
      } else {
        reset(STATION_FORM_INITIAL_DATA)
      }
    }
  }, [open, station, reset, isEditMode, isViewMode])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateStationPayload) =>
      isEditMode && stationId
        ? stationService.updateStation(stationId, data)
        : stationService.createStation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.stations.all,
      })
      toast.success(
        isEditMode
          ? "Terminal / Station updated successfully"
          : "Terminal / Station created successfully"
      )
      reset()
      onClose(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save station details")
    },
  })

  const onSubmit: SubmitHandler<CreateStationPayload> = (data) => {
    const payload: CreateStationPayload = {
      name: data.name,
      city: data.city,
      state: data.state,
      terminalName: data.terminalName,
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
      isActive: Boolean(data.isActive),
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
          ? "View Station Details"
          : isEditMode
          ? "Edit Bus Station / Terminal"
          : "Add Bus Station / Terminal"
      }
      description={
        isViewMode
          ? "Viewing bus station information, terminal details, and GPS location."
          : isEditMode
          ? "Update bus station specifications and active status."
          : "Register a new bus terminal or station hub for route corridor planning."
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
              form="station-form"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Update Station"
                : "Save Station"}
            </Button>
          )}
        </div>
      }
    >
      <form
        id="station-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {/* Section 01: Station & City Details */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("01", "Station & City Information")}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                control={control}
                name="name"
                label="STATION / TERMINAL NAME"
                placeholder="e.g. Kashmere Gate ISBT"
                required
                readOnly={isViewMode}
              />
            </div>

            <FormField
              control={control}
              name="city"
              label="CITY"
              placeholder="e.g. Delhi"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="state"
              label="STATE / PROVINCE"
              placeholder="e.g. Delhi"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="terminalName"
              label="TERMINAL / BAY NAME"
              placeholder="e.g. Platform 4, Interstate Terminal"
              readOnly={isViewMode}
            />

            <FormSelectField
              control={control}
              name="isActive"
              label="STATION STATUS"
              options={[
                { label: "Active", value: true as any },
                { label: "Inactive", value: false as any },
              ]}
              disabled={isViewMode}
            />
          </div>
        </div>

        {/* Section 02: GPS Coordinates */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("02", "GPS Geolocation Coordinates")}

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={control}
              name="latitude"
              label="LATITUDE"
              placeholder="e.g. 28.6665"
              type="number"
              step="any"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="longitude"
              label="LONGITUDE"
              placeholder="e.g. 77.2333"
              type="number"
              step="any"
              readOnly={isViewMode}
            />
          </div>
        </div>
      </form>
    </FormContainer>
  )
}
