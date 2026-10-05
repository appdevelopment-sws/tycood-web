import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import {
  FormField,
  FormSelectField,
  FormFileUpload,
} from "@/components/ui/form-fields"
import { queryKeys } from "@/lib/queryKeys"
import {
  operatorService,
  type CreateOperatorPayload,
} from "@/services/operatorService"
import type { BusOperator } from "@/types/bus"
import sectionHeader from "@/components/sectionHeader"

import { OPERATOR_FORM_INITIAL_DATA } from "@/constants/page/super-admin/operators"

export interface OperatorDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  operator?: (BusOperator & { viewMode?: boolean }) | null
}

export default function OperatorDrawer({
  open,
  onClose,
  operator,
}: OperatorDrawerProps) {
  const isViewMode = !!operator?.viewMode
  const isEditMode = !!operator?.id
  const operatorId = operator?.id

  const { handleSubmit, control, reset } = useForm<CreateOperatorPayload>({
    defaultValues: OPERATOR_FORM_INITIAL_DATA,
    mode: "onChange",
  })

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        reset({
          name: operator?.name ?? "",
          code: operator?.code ?? "",
          contactEmail: operator?.contactEmail ?? "",
          contactPhone: operator?.contactPhone ?? "",
          address: operator?.address ?? "",
          status: (operator?.status &&
          ["ACTIVE", "INACTIVE", "SUSPENDED"].includes(operator.status)
            ? operator.status
            : "ACTIVE") as "ACTIVE" | "INACTIVE" | "SUSPENDED",
          logoUrl: operator?.logoUrl ?? "",
        })
      } else {
        reset(OPERATOR_FORM_INITIAL_DATA)
      }
    }
  }, [open, operator, reset, isEditMode, isViewMode])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateOperatorPayload) =>
      isEditMode && operatorId
        ? operatorService.updateOperator(operatorId, data)
        : operatorService.createOperator(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.operators.all,
      })
      toast.success(
        isEditMode
          ? "Operator updated successfully"
          : "Operator created successfully"
      )
      reset()
      onClose(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save operator")
    },
  })

  const onSubmit: SubmitHandler<CreateOperatorPayload> = (data) => {
    const payload: CreateOperatorPayload = {
      name: data.name,
      code: data.code,
      contactEmail: data.contactEmail || undefined,
      contactPhone: data.contactPhone || undefined,
      address: data.address || undefined,
      status: data.status,
      logoUrl: data.logoUrl || undefined,
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
          ? "View Operator"
          : isEditMode
            ? "Edit Operator"
            : "Add Operator"
      }
      description={
        isViewMode
          ? "Viewing  operator details."
          : isEditMode
            ? "Update  operator details."
            : "Create a new  operator."
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
              form="operator-form"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEditMode
                  ? "Update Operator"
                  : "Save Operator"}
            </Button>
          )}
        </div>
      }
    >
      <form
        id="operator-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {/* Section 01: Basic Info */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("01", "Operator Information")}

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={control}
              name="name"
              label="OPERATOR NAME"
              placeholder="e.g. Express Lines Logistics"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="code"
              label="OPERATOR CODE"
              placeholder="e.g. EXP"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="contactEmail"
              label="CONTACT EMAIL"
              placeholder="contact@expresslines.com"
              type="email"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="contactPhone"
              label="CONTACT PHONE"
              placeholder="+1 (555) 901-2384"
              readOnly={isViewMode}
            />

            <FormSelectField
              control={control}
              name="status"
              label="STATUS"
              options={[
                { label: "Active", value: "ACTIVE" },
                { label: "Inactive", value: "INACTIVE" },
                { label: "Suspended", value: "SUSPENDED" },
              ]}
              readOnly={isViewMode}
            />

            <div className="sm:col-span-2">
              <FormFileUpload
                control={control}
                name="logoUrl"
                label="OPERATOR LOGO"
                accept="image/*"
                multiple={false}
                fileType="image"
                disabled={isViewMode}
                readOnly={isViewMode}
              />
            </div>

            <div className="sm:col-span-2">
              <FormField
                control={control}
                name="address"
                label="OFFICE ADDRESS"
                placeholder="Enter office / hub address..."
                rows={2}
                readOnly={isViewMode}
              />
            </div>
          </div>
        </div>
      </form>
    </FormContainer>
  )
}
