import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import {
  FormField,
  FormSelectField,
  FormCheckboxField,
} from "@/components/ui/form-fields"
import { queryKeys } from "@/lib/queryKeys"
import { taxService } from "@/services/taxService"
import type { Tax, CreateTaxPayload } from "@/types/tax"
import sectionHeader from "@/components/sectionHeader"
import {
  TAX_FORM_INITIAL_DATA,
  TAX_TYPE_OPTIONS,
  TAX_SCOPE_OPTIONS,
} from "@/constants/page/super-admin/taxes"

export interface TaxDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  tax?: (Tax & { viewMode?: boolean }) | null
}

export default function TaxDrawer({ open, onClose, tax }: TaxDrawerProps) {
  const isViewMode = !!tax?.viewMode
  const isEditMode = !!tax?.id
  const taxId = tax?.id

  const { handleSubmit, control, reset } = useForm<CreateTaxPayload>({
    defaultValues: TAX_FORM_INITIAL_DATA,
    mode: "onChange",
  })

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        reset({
          name: tax?.name ?? "",
          code: tax?.code ?? "",
          taxType: tax?.taxType ?? "PERCENTAGE",
          rate: tax?.rate ?? 0,
          description: tax?.description ?? "",
          applicableOn: tax?.applicableOn ?? "ALL_RIDES",
          isIncludedInFare: tax?.isIncludedInFare ?? false,
          isActive: tax?.isActive ?? true,
          priority: tax?.priority ?? 1,
        })
      } else {
        reset(TAX_FORM_INITIAL_DATA)
      }
    }
  }, [open, tax, reset, isEditMode, isViewMode])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateTaxPayload) =>
      isEditMode && taxId
        ? taxService.updateTax(taxId, data)
        : taxService.createTax(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.taxes.all,
      })
      toast.success(
        isEditMode
          ? "Tax definition updated successfully"
          : "New tax added successfully"
      )
      reset()
      onClose(false)
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save tax definition")
    },
  })

  const onSubmit: SubmitHandler<CreateTaxPayload> = (data) => {
    mutation.mutate({
      ...data,
      rate: Number(data.rate),
      priority: Number(data.priority || 1),
      code: data.code.trim().toUpperCase().replace(/\s+/g, "_"),
    })
  }

  const modalTitle = isViewMode
    ? "Tax & Surcharge Details"
    : isEditMode
    ? "Edit Tax / Surcharge"
    : "Add New Tax / Levy"

  const modalDescription = isViewMode
    ? "Review tax configuration, percentage rate, and applicability scope."
    : isEditMode
    ? "Modify parameters for this tax rule across passenger calculations."
    : "Create a new custom tax, cess, toll surcharge, or government levy."

  return (
    <FormContainer
      open={open}
      onOpenChange={onClose}
      title={modalTitle}
      description={modalDescription}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
            className="text-xs"
          >
            {isViewMode ? "Close" : "Cancel"}
          </Button>

          {!isViewMode && (
            <Button
              type="submit"
              form="tax-form"
              disabled={mutation.isPending}
              className="gap-2 bg-indigo-600 px-5 text-xs font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Tax"
              )}
            </Button>
          )}
        </div>
      }
    >
      <form id="tax-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 01: Identification */}
        <div>
          {sectionHeader("01", "Tax Identification & Legal Reference")}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="name"
              label="Tax Name / Title"
              placeholder="e.g. Goods & Services Tax (GST 5%)"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="code"
              label="Tax Identifier Code"
              placeholder="e.g. GST_5 or AIRPORT_CESS"
              required
              readOnly={isViewMode}
            />
          </div>

          <div className="mt-4">
            <FormField
              control={control}
              name="description"
              label="Notes & Purpose (Optional)"
              placeholder="Explain where this tax applies or statutory notification reference"
              rows={2}
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Section 02: Rate & Calculation Rules */}
        <div>
          {sectionHeader("02", "Rate & Calculation Rules")}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormSelectField
              control={control}
              name="taxType"
              label="Tax Type"
              options={TAX_TYPE_OPTIONS}
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="rate"
              type="number"
              step="0.01"
              label="Tax Rate / Fee Amount"
              placeholder="e.g. 5 for 5% or 50 for flat ₹50"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="priority"
              type="number"
              label="Calculation Priority"
              placeholder="1, 2, 3..."
              readOnly={isViewMode}
            />
          </div>

          <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <FormCheckboxField
              control={control}
              name="isIncludedInFare"
              label="Tax is already included in displayed fare"
              description="If checked, this tax is extracted from base fare; if unchecked, it is added as an extra itemized line on checkout."
              disabled={isViewMode}
            />
          </div>
        </div>

        {/* Section 03: Applicability & Status */}
        <div>
          {sectionHeader("03", "Application Scope & Enforcement")}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormSelectField
              control={control}
              name="applicableOn"
              label="Ride Application Scope"
              options={TAX_SCOPE_OPTIONS}
              required
              readOnly={isViewMode}
            />

            <div className="flex flex-col justify-end">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                <FormCheckboxField
                  control={control}
                  name="isActive"
                  label="Enforce Tax (Active)"
                  description="When enabled, this tax is actively computed during checkout."
                  disabled={isViewMode}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormContainer>
  )
}
