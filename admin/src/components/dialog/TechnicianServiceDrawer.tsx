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
import sectionHeader from "@/components/sectionHeader"
import {
  technicianService,
  type TechnicianServiceCatalogItem,
  type TechnicianCategory,
} from "@/services/technicianService"

export interface TechnicianServiceDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  serviceItem?: (TechnicianServiceCatalogItem & { viewMode?: boolean }) | null
  categories: TechnicianCategory[]
  defaultCategoryId?: string
}

interface ServiceItemFormData {
  categoryId: string
  name: string
  description: string
  estimatedDurationMinutes: number
  isInspectionRequired: boolean
  displayOrder: number
  isActive: boolean
}

const INITIAL_SERVICE_ITEM_DATA: ServiceItemFormData = {
  categoryId: "",
  name: "",
  description: "",
  estimatedDurationMinutes: 30,
  isInspectionRequired: false,
  displayOrder: 0,
  isActive: true,
}

export default function TechnicianServiceDrawer({
  open,
  onClose,
  serviceItem,
  categories,
  defaultCategoryId,
}: TechnicianServiceDrawerProps) {
  const isViewMode = !!serviceItem?.viewMode
  const isEditMode = !!serviceItem?.id
  const serviceItemId = serviceItem?.id

  const { handleSubmit, control, reset } = useForm<ServiceItemFormData>({
    defaultValues: INITIAL_SERVICE_ITEM_DATA,
    mode: "onChange",
  })

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        reset({
          categoryId: serviceItem?.categoryId ?? defaultCategoryId ?? "",
          name: serviceItem?.name ?? "",
          description: serviceItem?.description ?? "",
          estimatedDurationMinutes: serviceItem?.estimatedDurationMinutes ?? 30,
          isInspectionRequired: !!serviceItem?.isInspectionRequired,
          displayOrder: serviceItem?.displayOrder ?? 0,
          isActive: serviceItem?.isActive ?? true,
        })
      } else {
        reset({
          ...INITIAL_SERVICE_ITEM_DATA,
          categoryId: defaultCategoryId ?? (categories[0]?.id || ""),
        })
      }
    }
  }, [open, serviceItem, reset, isEditMode, isViewMode, defaultCategoryId, categories])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: Partial<TechnicianServiceCatalogItem>) =>
      isEditMode && serviceItemId
        ? technicianService.updateServiceItem(serviceItemId, data)
        : technicianService.createServiceItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technician-categories"] })
      toast.success(
        isEditMode
          ? "Service item updated successfully"
          : "New catalog service item created successfully"
      )
      reset()
      onClose(false)
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save service item")
    },
  })

  const onSubmit: SubmitHandler<ServiceItemFormData> = (data) => {
    mutation.mutate({
      ...data,
      estimatedDurationMinutes: Number(data.estimatedDurationMinutes) || 30,
      displayOrder: Number(data.displayOrder) || 0,
    })
  }

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.id,
  }))

  const modalTitle = isViewMode
    ? "Catalog Service Details"
    : isEditMode
    ? "Edit Catalog Service"
    : "Add Service to Catalog"

  const modalDescription = isViewMode
    ? "View details for this roadside assistance service."
    : isEditMode
    ? "Update service name, duration, and inspection parameters."
    : "Create a new service item in the master catalog. Providers can choose this service and set their own custom price."

  return (
    <FormContainer
      open={open}
      onOpenChange={onClose}
      title={modalTitle}
      description={modalDescription}
      size="md"
      footer={
        <div className="flex w-full items-center justify-end gap-3">
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
              form="technician-service-item-form"
              disabled={mutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Add Service"
              )}
            </Button>
          )}
        </div>
      }
    >
      <form
        id="technician-service-item-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div>
          {sectionHeader("01", "Service Specifications")}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormSelectField
                name="categoryId"
                control={control}
                label="Parent Category"
                placeholder="Select category"
                options={categoryOptions}
                required
                disabled={isViewMode}
              />
            </div>

            <FormField
              name="name"
              control={control}
              label="Service Name"
              placeholder="e.g. Battery Jumpstart, Tire Puncture Repair"
              required
              readOnly={isViewMode}
            />

            <FormField
              name="estimatedDurationMinutes"
              control={control}
              label="Estimated Duration (Minutes)"
              type="number"
              placeholder="30"
              readOnly={isViewMode}
            />

            <div className="sm:col-span-2">
              <FormField
                name="description"
                control={control}
                label="Scope / Description"
                placeholder="Explanation of what the service covers"
                readOnly={isViewMode}
              />
            </div>
          </div>
        </div>

        <div>
          {sectionHeader("02", "Inspection & Availability")}
          <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <FormCheckboxField
              name="isInspectionRequired"
              control={control}
              label="Requires On-Site Diagnostic / Inspection"
              description="If enabled, price is quoted dynamically by the mechanic after inspecting vehicle."
              disabled={isViewMode}
            />

            <FormCheckboxField
              name="isActive"
              control={control}
              label="Service Active in Catalog"
              description="Allow mechanics to select and configure custom prices for this service."
              disabled={isViewMode}
            />
          </div>
        </div>
      </form>
    </FormContainer>
  )
}
