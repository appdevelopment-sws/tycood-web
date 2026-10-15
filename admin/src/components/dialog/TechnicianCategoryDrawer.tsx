import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import {
  FormField,
  FormCheckboxField,
} from "@/components/ui/form-fields"
import sectionHeader from "@/components/sectionHeader"
import {
  technicianService,
  type TechnicianCategory,
} from "@/services/technicianService"

export interface TechnicianCategoryDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  category?: (TechnicianCategory & { viewMode?: boolean }) | null
}

interface CategoryFormData {
  name: string
  description: string
  icon: string
  basePrice: number
  isOther: boolean
  displayOrder: number
  isActive: boolean
}

const INITIAL_CATEGORY_DATA: CategoryFormData = {
  name: "",
  description: "",
  icon: "Wrench",
  basePrice: 450,
  isOther: false,
  displayOrder: 0,
  isActive: true,
}

export default function TechnicianCategoryDrawer({
  open,
  onClose,
  category,
}: TechnicianCategoryDrawerProps) {
  const isViewMode = !!category?.viewMode
  const isEditMode = !!category?.id
  const categoryId = category?.id

  const { handleSubmit, control, reset } = useForm<CategoryFormData>({
    defaultValues: INITIAL_CATEGORY_DATA,
    mode: "onChange",
  })

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        reset({
          name: category?.name ?? "",
          description: category?.description ?? "",
          icon: category?.icon ?? "Wrench",
          basePrice: category?.basePrice ? Number(category.basePrice) : 0,
          isOther: !!category?.isOther,
          displayOrder: category?.displayOrder ?? 0,
          isActive: category?.isActive ?? true,
        })
      } else {
        reset(INITIAL_CATEGORY_DATA)
      }
    }
  }, [open, category, reset, isEditMode, isViewMode])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: Partial<TechnicianCategory>) =>
      isEditMode && categoryId
        ? technicianService.updateCategory(categoryId, data)
        : technicianService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technician-categories"] })
      toast.success(
        isEditMode
          ? "Service category updated successfully"
          : "New service category created successfully"
      )
      reset()
      onClose(false)
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save category")
    },
  })

  const onSubmit: SubmitHandler<CategoryFormData> = (data) => {
    mutation.mutate({
      ...data,
      basePrice: Number(data.basePrice) || 0,
      displayOrder: Number(data.displayOrder) || 0,
    })
  }

  const modalTitle = isViewMode
    ? "Category Details"
    : isEditMode
    ? "Edit Service Category"
    : "Add Service Category"

  const modalDescription = isViewMode
    ? "View details for this roadside technician category."
    : isEditMode
    ? "Update category naming, icon, and dynamic inspection settings."
    : "Create a new category for mechanics to offer roadside breakdown services."

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
              form="technician-category-form"
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
                "Create Category"
              )}
            </Button>
          )}
        </div>
      }
    >
      <form
        id="technician-category-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div>
          {sectionHeader("01", "Category Definition")}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              name="name"
              control={control}
              label="Category Name"
              placeholder="e.g. Battery & Jumpstart"
              required
              readOnly={isViewMode}
            />

            <FormField
              name="icon"
              control={control}
              label="Icon Identifier"
              placeholder="e.g. BatteryCharging, Wrench, Disc"
              readOnly={isViewMode}
            />

            <div className="sm:col-span-2">
              <FormField
                name="description"
                control={control}
                label="Description"
                placeholder="Brief explanation of services covered in this category"
                readOnly={isViewMode}
              />
            </div>
          </div>
        </div>

        <div>
          {sectionHeader("02", "Quotation & Display Settings")}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              name="basePrice"
              control={control}
              label="Standard Base Rate (₹)"
              type="number"
              placeholder="e.g. 450"
              readOnly={isViewMode}
            />

            <FormField
              name="displayOrder"
              control={control}
              label="Display Order Index"
              type="number"
              placeholder="0"
              readOnly={isViewMode}
            />

            <div className="space-y-3 sm:col-span-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <FormCheckboxField
                name="isOther"
                control={control}
                label="Flag as 'Other / Unaware of Issue' Category"
                description="When selected by users, skips upfront pricing and triggers the inspection quotation flow where provider inspects and quotes a price."
                disabled={isViewMode}
              />

              <FormCheckboxField
                name="isActive"
                control={control}
                label="Category Active & Visible to Customers"
                description="Controls whether this category is shown in the customer app."
                disabled={isViewMode}
              />
            </div>
          </div>
        </div>
      </form>
    </FormContainer>
  )
}
