import { useEffect } from "react"
import { useForm, Controller, type SubmitHandler } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import { FormField, FormSelectField } from "@/components/ui/form-fields"
import { queryKeys } from "@/lib/queryKeys"
import { seatService, type CreateSeatPayload } from "@/services/seatService"
import { busService } from "@/services/busService"
import type { Seat } from "@/types/bus"
import sectionHeader from "@/components/sectionHeader"
import {
  SEAT_FORM_INITIAL_DATA,
  SEAT_TYPE_OPTIONS,
  SEAT_DECK_OPTIONS,
} from "@/constants/page/super-admin/seats"

export interface SeatDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  seat?: (Seat & { viewMode?: boolean }) | null
  defaultBusId?: string
}

export default function SeatDrawer({
  open,
  onClose,
  seat,
  defaultBusId,
}: SeatDrawerProps) {
  const isViewMode = !!seat?.viewMode
  const isEditMode = !!seat?.id
  const seatId = seat?.id

  const { handleSubmit, control, reset } = useForm<CreateSeatPayload>({
    defaultValues: {
      ...SEAT_FORM_INITIAL_DATA,
      busId: defaultBusId || "",
    },
    mode: "onChange",
  })

  // Fetch buses for dropdown
  const { data: buses = [] } = useQuery({
    queryKey: queryKeys.buses.all,
    queryFn: () => busService.getBuses(),
    enabled: open,
  })

  const busOptions = buses.map((b) => ({
    label: `${b.busName} (${b.registrationNumber})`,
    value: b.id,
  }))

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        reset({
          busId: seat?.busId ?? defaultBusId ?? "",
          seatNumber: seat?.seatNumber ?? "",
          seatType: (seat?.seatType || seat?.type || "SEATER") as any,
          deck: (seat?.deck || "LOWER") as any,
          row: Number(seat?.row) || 1,
          column: Number(seat?.column) || 0,
          positionX: Number(seat?.positionX) || 0,
          positionY: Number(seat?.positionY) || 0,
          isWindowSeat: Boolean(seat?.isWindowSeat),
          isAisleSeat: Boolean(seat?.isAisleSeat),
          isLastRow: Boolean(seat?.isLastRow),
          isVisible:
            seat?.isVisible !== undefined ? Boolean(seat?.isVisible) : true,
        })
      } else {
        reset({
          ...SEAT_FORM_INITIAL_DATA,
          busId: defaultBusId || "",
        })
      }
    }
  }, [open, seat, reset, isEditMode, isViewMode, defaultBusId])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateSeatPayload) =>
      isEditMode && seatId
        ? seatService.updateSeat(seatId, data)
        : seatService.createSeat(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.seats.all,
      })
      if (variables.busId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.seats.byBus(variables.busId),
        })
      }
      toast.success(
        isEditMode
          ? "Seat details updated successfully"
          : "Physical seat created successfully"
      )
      reset()
      onClose(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save seat details")
    },
  })

  const onSubmit: SubmitHandler<CreateSeatPayload> = (data) => {
    const payload: CreateSeatPayload = {
      busId: data.busId,
      seatNumber: data.seatNumber,
      seatType: data.seatType,
      deck: data.deck,
      row: Number(data.row) || 1,
      column: Number(data.column) || 0,
      positionX: Number(data.positionX) || 0,
      positionY: Number(data.positionY) || 0,
      isWindowSeat: Boolean(data.isWindowSeat),
      isAisleSeat: Boolean(data.isAisleSeat),
      isLastRow: Boolean(data.isLastRow),
      isVisible: Boolean(data.isVisible),
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
          ? "View Seat Configuration"
          : isEditMode
            ? "Edit Physical Seat"
            : "Add Physical Seat"
      }
      description={
        isViewMode
          ? "Viewing physical seat placement and matrix configuration."
          : isEditMode
            ? "Update seat designation, deck level, or matrix coordinates."
            : "Add a single custom seat to the selected bus physical layout."
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
              form="seat-form"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEditMode
                  ? "Update Seat"
                  : "Save Seat"}
            </Button>
          )}
        </div>
      }
    >
      <form
        id="seat-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {/* Section 01: Seat Identification */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("01", "Seat Identification")}

          <div className="grid gap-6 sm:grid-cols-2">
            <FormSelectField
              control={control}
              name="busId"
              label=" VEHICLE"
              placeholder="Select target ..."
              options={busOptions}
              required
              disabled={isViewMode || isEditMode}
            />

            <FormField
              control={control}
              name="seatNumber"
              label="SEAT NUMBER / CODE"
              placeholder="e.g. 1A, L01, U04"
              required
              readOnly={isViewMode}
            />

            <FormSelectField
              control={control}
              name="seatType"
              label="SEAT CATEGORY / TYPE"
              options={SEAT_TYPE_OPTIONS}
              required
              disabled={isViewMode}
            />

            <FormSelectField
              control={control}
              name="deck"
              label="DECK LEVEL"
              options={SEAT_DECK_OPTIONS}
              required
              disabled={isViewMode}
            />
          </div>
        </div>

        {/* Section 02: Grid Matrix Position */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("02", "Grid Matrix Position")}

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={control}
              name="row"
              label="ROW INDEX (1..N)"
              placeholder="e.g. 1"
              type="number"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="column"
              label="COLUMN INDEX (0..N)"
              placeholder="e.g. 0 (Left Window), 1 (Aisle Left)..."
              type="number"
              required
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Section 03: Seat Features & Flags */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("03", "Seat Attributes & Visibility")}

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="isWindowSeat"
              render={({ field: { value, onChange } }) => (
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50">
                  <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={isViewMode}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Window Seat
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Positioned adjacent to vehicle window
                    </div>
                  </div>
                </label>
              )}
            />

            <Controller
              control={control}
              name="isAisleSeat"
              render={({ field: { value, onChange } }) => (
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50">
                  <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={isViewMode}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Aisle Access Seat
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Direct access to central corridor aisle
                    </div>
                  </div>
                </label>
              )}
            />

            <Controller
              control={control}
              name="isLastRow"
              render={({ field: { value, onChange } }) => (
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50">
                  <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={isViewMode}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Back / Last Row Seat
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Located in rear bench row
                    </div>
                  </div>
                </label>
              )}
            />

            <Controller
              control={control}
              name="isVisible"
              render={({ field: { value, onChange } }) => (
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50">
                  <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={isViewMode}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Active / Visible for Booking
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Visible and available for trip generation
                    </div>
                  </div>
                </label>
              )}
            />
          </div>
        </div>
      </form>
    </FormContainer>
  )
}
