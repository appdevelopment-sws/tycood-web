import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Sparkles, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import { queryKeys } from "@/lib/queryKeys"
import { seatService } from "@/services/seatService"
import { LAYOUT_PRESET_OPTIONS } from "@/constants/page/super-admin/seats"
import type { Bus } from "@/types/bus"

export interface GenerateLayoutDialogProps {
  open: boolean
  onClose: (open: boolean) => void
  selectedBus?: Bus | null
}

export default function GenerateLayoutDialog({
  open,
  onClose,
  selectedBus,
}: GenerateLayoutDialogProps) {
  const [selectedPattern, setSelectedPattern] = useState<string>("2x2")
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ busId, pattern }: { busId: string; pattern: string }) =>
      seatService.generateSeatLayout(busId, pattern),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seats.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.seats.byBus(variables.busId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.buses.all })
      toast.success("Physical seat layout preset generated successfully!")
      onClose(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to generate layout preset")
    },
  })

  const handleGenerate = () => {
    if (!selectedBus?.id) {
      toast.error("Please select a bus vehicle first!")
      return
    }
    mutation.mutate({ busId: selectedBus.id, pattern: selectedPattern })
  }

  return (
    <FormContainer
      variant="modal"
      open={open}
      onOpenChange={(isOpen) => onClose(isOpen)}
      title="Generate Physical Layout Preset"
      description={`Automatically construct standard physical seating matrix for ${selectedBus?.busName || "selected bus"}.`}
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={mutation.isPending || !selectedBus?.id}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Sparkles className="h-4 w-4" />
            {mutation.isPending ? "Generating..." : "Generate Preset Layout"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-xs text-amber-800 dark:text-amber-300">
              <span className="font-semibold">Notice:</span> Generating a layout preset will clear any existing physical seat configuration for vehicle{" "}
              <span className="font-bold">{selectedBus?.busName || "this bus"}</span> ({selectedBus?.registrationNumber}).
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            Select Seating Layout Pattern
          </label>
          <div className="grid gap-3">
            {LAYOUT_PRESET_OPTIONS.map((opt) => (
              <div
                key={opt.pattern}
                onClick={() => setSelectedPattern(opt.pattern)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedPattern === opt.pattern
                    ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/30"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {opt.name}
                  </span>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {opt.pattern}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {opt.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FormContainer>
  )
}
