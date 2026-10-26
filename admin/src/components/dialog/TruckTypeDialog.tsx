import { useEffect, useState } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { X, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import {
  FormField,
  FormSelectField,
  FormCheckboxField,
} from "@/components/ui/form-fields"
import sectionHeader from "@/components/sectionHeader"
import { queryKeys } from "@/lib/queryKeys"
import { logisticsService } from "@/services/logisticsService"
import type { TruckType, CreateTruckTypePayload } from "@/types/logistics"

export interface TruckTypeDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  truckType?: (TruckType & { viewMode?: boolean }) | null
}

const CATEGORY_OPTIONS = [
  { label: "Open Body", value: "Open" },
  { label: "Closed Container", value: "Container" },
  { label: "LCV (Light Commercial)", value: "LCV" },
  { label: "Mini / Pickup (Last Mile)", value: "Mini/Pickup" },
  { label: "Flatbed Trailer (Long Steel/Machinery)", value: "Trailer" },
  { label: "Tipper (Sand & Aggregates)", value: "Tipper" },
  { label: "Liquid Tanker", value: "Tanker" },
  { label: "Dumper", value: "Dumper" },
  { label: "Cement Bulker", value: "Bulker" },
]

const BODY_TYPE_OPTIONS = [
  { label: "Open Half Body", value: "Open Half Body" },
  { label: "Open Full Body", value: "Open Full Body" },
  { label: "Closed Container", value: "Container" },
  { label: "Flatbed Trailer (Unrestricted Deck)", value: "Flatbed Trailer" },
  { label: "LCV", value: "LCV" },
  { label: "Mini/Pickup", value: "Mini/Pickup" },
  { label: "Tipper", value: "Tipper" },
  { label: "Tanker", value: "Tanker" },
  { label: "Dumper", value: "Dumper" },
  { label: "Bulker", value: "Bulker" },
]

const WHEEL_OPTIONS = [
  { label: "4 Wheeler (Mini/Pickup)", value: "4 Wheeler" },
  { label: "6 Wheeler (LCV)", value: "6 Wheeler" },
  { label: "10 Wheeler (Medium Heavy)", value: "10 Wheeler" },
  { label: "12 Wheeler (Multi-Axle)", value: "12 Wheeler" },
  { label: "14 Wheeler (Heavy Freight)", value: "14 Wheeler" },
  { label: "16 Wheeler (Heavy Duty)", value: "16 Wheeler" },
  { label: "18 Wheeler (Long Trailer)", value: "18 Wheeler" },
  { label: "22 Wheeler (Ultra Heavy Haul)", value: "22 Wheeler" },
]

const INITIAL_DATA: CreateTruckTypePayload = {
  name: "Open Half/Full Body",
  category: "Open",
  bodyType: "Open Half Body",
  lengthFt: 28,
  widthFt: 8,
  heightFt: 7.5,
  dimensionLabel: "28ft Open Body (High Bed)",
  minTons: 7.5,
  maxTons: 43.0,
  capacityRange: "7.5 - 43 Ton",
  wheelsNumber: 14,
  wheelCount: "14 Wheeler",
  suitableMaterials: [
    "Ata chokar & Grains",
    "Cement & Bulker Goods",
    "TMT Iron Rods & Structural Steel",
  ],
  sortOrder: 1,
  isActive: true,
  description: "Standard heavy duty multi-axle open truck for interstate and state highway freight",
}

export default function TruckTypeDrawer({ open, onClose, truckType }: TruckTypeDrawerProps) {
  const isViewMode = !!truckType?.viewMode
  const isEditMode = !!truckType?.id
  const truckTypeId = truckType?.id

  const queryClient = useQueryClient()

  const [materialsList, setMaterialsList] = useState<string[]>([])
  const [materialInput, setMaterialInput] = useState("")

  const { handleSubmit, control, reset, setValue } = useForm<CreateTruckTypePayload>({
    defaultValues: INITIAL_DATA,
    mode: "onChange",
  })

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        setMaterialsList(truckType?.suitableMaterials || [])
        reset({
          name: truckType?.name ?? "",
          category: truckType?.category ?? "Open",
          bodyType: truckType?.bodyType ?? "Open Half Body",
          lengthFt: Number(truckType?.lengthFt ?? 28),
          widthFt: Number(truckType?.widthFt ?? 8),
          heightFt: Number(truckType?.heightFt ?? 7.5),
          dimensionLabel: truckType?.dimensionLabel ?? "",
          minTons: Number(truckType?.minTons ?? 7.5),
          maxTons: Number(truckType?.maxTons ?? 43),
          capacityRange: truckType?.capacityRange ?? "7.5 - 43 Ton",
          wheelsNumber: Number(truckType?.wheelsNumber ?? 14),
          wheelCount: truckType?.wheelCount ?? "14 Wheeler",
          suitableMaterials: truckType?.suitableMaterials ?? [],
          sortOrder: truckType?.sortOrder ?? 0,
          isActive: truckType?.isActive ?? true,
          description: truckType?.description ?? "",
        })
      } else {
        setMaterialsList(INITIAL_DATA.suitableMaterials || [])
        reset(INITIAL_DATA)
      }
    }
  }, [open, truckType, isEditMode, isViewMode, reset])

  const mutation = useMutation({
    mutationFn: (data: CreateTruckTypePayload) =>
      isEditMode && truckTypeId
        ? logisticsService.updateTruckType(truckTypeId, data)
        : logisticsService.createTruckType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.truckTypes.all })
      toast.success(
        isEditMode
          ? "Truck type updated successfully"
          : "New truck type registered successfully"
      )
      onClose(false)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save truck type")
    },
  })

  const onSubmit: SubmitHandler<CreateTruckTypePayload> = (formData) => {
    const payload: CreateTruckTypePayload = {
      ...formData,
      lengthFt: Number(formData.lengthFt),
      widthFt: Number(formData.widthFt),
      heightFt: Number(formData.heightFt),
      minTons: Number(formData.minTons),
      maxTons: Number(formData.maxTons),
      wheelsNumber: Number(formData.wheelsNumber),
      sortOrder: Number(formData.sortOrder),
      suitableMaterials: materialsList,
      dimensionLabel:
        formData.dimensionLabel ||
        `${formData.lengthFt}ft x ${formData.widthFt}ft ${formData.name}`,
    }
    mutation.mutate(payload)
  }

  const handleAddMaterial = () => {
    const trimmed = materialInput.trim()
    if (!trimmed) return
    if (materialsList.includes(trimmed)) {
      toast.warning("Material already in list")
      return
    }
    const updated = [...materialsList, trimmed]
    setMaterialsList(updated)
    setValue("suitableMaterials", updated)
    setMaterialInput("")
  }

  const handleRemoveMaterial = (item: string) => {
    if (isViewMode) return
    const updated = materialsList.filter((m) => m !== item)
    setMaterialsList(updated)
    setValue("suitableMaterials", updated)
  }

  return (
    <FormContainer
      open={open}
      onOpenChange={onClose}
      title={
        isViewMode
          ? `View Vehicle Type: ${truckType?.name || ""}`
          : isEditMode
            ? `Edit Vehicle Type: ${truckType?.name || ""}`
            : "Add New Logistics Vehicle Type"
      }
      description="Configure truck categories, physical dimensions (length, height), tonnage capacity, and suitable materials for freight matching."
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button type="button" variant="outline" onClick={() => onClose(false)}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button
              type="submit"
              form="truck-type-form"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEditMode
                  ? "Update Truck Type"
                  : "Create Truck Type"}
            </Button>
          )}
        </div>
      }
    >
      <form
        id="truck-type-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Section 01: Classification */}
        <div>
          {sectionHeader("01", "Classification & Body Type")}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
            <FormField
              control={control}
              name="name"
              label="Truck / Vehicle Type Name"
              placeholder="e.g. Open Half/Full Body, Flatbed Trailer"
              readOnly={isViewMode}
              required
            />
            <FormSelectField
              control={control}
              name="category"
              label="Broad Fleet Category"
              options={CATEGORY_OPTIONS}
              readOnly={isViewMode}
              required
            />
            <FormSelectField
              control={control}
              name="bodyType"
              label="Standard Body Style"
              options={BODY_TYPE_OPTIONS}
              readOnly={isViewMode}
              required
            />
            <FormField
              control={control}
              name="sortOrder"
              label="Display Order (Grid sorting)"
              type="number"
              placeholder="1"
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Section 02: Dimensions & Length (Supports Long Rods / Steel) */}
        <div>
          {sectionHeader("02", "Body Dimensions & Length Clearance")}
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Accurate length and height ensure long goods (e.g. 40ft TMT Iron Rods, Structural Steel Beams, Long Industrial Pipes) are only assigned to vehicles with sufficient deck clearance.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={control}
              name="lengthFt"
              label="Length (Feet)"
              type="number"
              placeholder="e.g. 28 or 40"
              readOnly={isViewMode}
              required
            />
            <FormField
              control={control}
              name="widthFt"
              label="Width (Feet)"
              type="number"
              placeholder="e.g. 8"
              readOnly={isViewMode}
              required
            />
            <FormField
              control={control}
              name="heightFt"
              label="Height / Wall (Feet)"
              type="number"
              placeholder="e.g. 7.5"
              readOnly={isViewMode}
              required
            />
          </div>
          <div className="mt-3">
            <FormField
              control={control}
              name="dimensionLabel"
              label="Dimension Display Tag"
              placeholder="e.g. 28ft x 8ft x 7.5ft Open High Bed, 40ft Flatbed"
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Section 03: Tonnage Capacity & Wheel Axles */}
        <div>
          {sectionHeader("03", "Payload Tonnage & Wheel / Axle Count")}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-3">
            <FormField
              control={control}
              name="minTons"
              label="Min Tonnage (Ton)"
              type="number"
              placeholder="7.5"
              readOnly={isViewMode}
              required
            />
            <FormField
              control={control}
              name="maxTons"
              label="Max Tonnage (Ton)"
              type="number"
              placeholder="43.0"
              readOnly={isViewMode}
              required
            />
            <FormField
              control={control}
              name="capacityRange"
              label="Capacity Range Label"
              placeholder="e.g. 7.5 - 43 Ton or 29-30 Ton"
              readOnly={isViewMode}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
            <FormField
              control={control}
              name="wheelsNumber"
              label="Number of Wheels (Tyres)"
              type="number"
              placeholder="14"
              readOnly={isViewMode}
            />
            <FormSelectField
              control={control}
              name="wheelCount"
              label="Wheel Specification Label"
              options={WHEEL_OPTIONS}
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Section 04: Suitable Materials & Goods */}
        <div>
          {sectionHeader("04", "Suitable Cargo & Goods Handled")}
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            Add types of materials this truck is certified or optimized to transport.
          </p>

          {!isViewMode && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={materialInput}
                onChange={(e) => setMaterialInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddMaterial()
                  }
                }}
                placeholder="e.g. 40ft TMT Iron Rods, Cement, Grains, Liquid Fuel..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddMaterial}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-border bg-muted/20 min-h-[50px]">
            {materialsList.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">
                No materials specified yet.
              </span>
            ) : (
              materialsList.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 text-xs font-medium"
                >
                  {item}
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(item)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>

          <div className="mt-4">
            <FormField
              control={control}
              name="description"
              label="Operational Description / Driver Notes"
              placeholder="e.g. Flatbed with mandatory twist locks and strapping hooks for long steel coils and rods"
              readOnly={isViewMode}
            />
          </div>

          <div className="mt-4">
            <FormCheckboxField
              control={control}
              name="isActive"
              label="Active in Marketplace (Drivers can filter by this vehicle)"
              readOnly={isViewMode}
            />
          </div>
        </div>
      </form>
    </FormContainer>
  )
}
