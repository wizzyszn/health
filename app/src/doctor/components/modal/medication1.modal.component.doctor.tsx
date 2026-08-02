import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Minus,
  Loader2,
  Trash2,
  Pill,
  Send,
  CalendarIcon,
} from "lucide-react";
import { format, isValid, parse } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createMedicationForConsultationReq,
  deleteMedicationRecordReq,
  getMedicationsForConsultation,
  updateMedicationRecordReq,
} from "@/config/service/doctor.service";
import {
  MEDICATION_DOSE_UNIT_OPTIONS,
  MEDICATION_DURATION_UNIT_OPTIONS,
  MEDICATION_FORMULARY_OPTIONS,
  MEDICATION_INTERVAL_OPTIONS,
  isTouchedMedicationRow,
  medicationPrescriptionModalSchema,
  type MedicationPrescriptionModalValues,
  type MedicationPrescriptionRowValues,
} from "@/lib/validation-schemas";

interface MedicationModalProps {
  onClose: () => void;
  consultationId?: string;
}

type MedicationRowPrefix =
  | `pendingMedications.${number}`
  | `newMedications.${number}`;

function createEmptyMedicationRow(): Partial<MedicationPrescriptionRowValues> {
  return {
    medication: "",
    start_date: "",
    order_instruction: "",
  };
}

function parseMedicationStartDate(value?: string) {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

function normalizeDoseUnit(
  unit?: string,
): MedicationPrescriptionRowValues["unit"] | undefined {
  if (!unit) return undefined;
  if (unit === "TABS") return "TAB";
  return MEDICATION_DOSE_UNIT_OPTIONS.includes(
    unit as MedicationPrescriptionRowValues["unit"],
  )
    ? (unit as MedicationPrescriptionRowValues["unit"])
    : undefined;
}

function normalizeFormulary(
  value?: string,
): MedicationPrescriptionRowValues["formulary"] | undefined {
  return MEDICATION_FORMULARY_OPTIONS.includes(
    value as MedicationPrescriptionRowValues["formulary"],
  )
    ? (value as MedicationPrescriptionRowValues["formulary"])
    : undefined;
}

function normalizeInterval(
  value?: string,
): MedicationPrescriptionRowValues["interval"] | undefined {
  return MEDICATION_INTERVAL_OPTIONS.includes(
    value as MedicationPrescriptionRowValues["interval"],
  )
    ? (value as MedicationPrescriptionRowValues["interval"])
    : undefined;
}

function normalizeDurationUnit(
  value?: string,
): MedicationPrescriptionRowValues["duration_unit"] | undefined {
  return MEDICATION_DURATION_UNIT_OPTIONS.includes(
    value as MedicationPrescriptionRowValues["duration_unit"],
  )
    ? (value as MedicationPrescriptionRowValues["duration_unit"])
    : undefined;
}

function mapApiMedicationToRow(
  medication: Awaited<
    ReturnType<typeof getMedicationsForConsultation>
  >["data"][number],
): MedicationPrescriptionRowValues {
  const formulary = normalizeFormulary(medication.formulary);
  const unit = normalizeDoseUnit(medication.unit);
  const interval = normalizeInterval(medication.interval);
  const duration_unit = normalizeDurationUnit(medication.duration_unit);

  if (!formulary || !unit || !interval || !duration_unit) {
    throw new Error(`Invalid medication data for ${medication._id}`);
  }

  return {
    _id: medication._id,
    formulary,
    medication: medication.medication ?? "",
    dose: medication.dose,
    unit,
    interval,
    duration: medication.duration,
    duration_unit,
    start_date: medication.start_date ?? "",
    order_instruction: medication.order_instruction ?? "",
  };
}

function mapRowToApiPayload(
  row: MedicationPrescriptionRowValues,
  assignToPatient: boolean,
) {
  return {
    formulary: row.formulary,
    medication: row.medication,
    unit: row.unit,
    dose: row.dose,
    interval: row.interval,
    duration_unit: row.duration_unit,
    duration: row.duration,
    start_date: row.start_date || undefined,
    order_instruction: row.order_instruction || undefined,
    assign_to_patient: assignToPatient,
  };
}

function MedicationRowFields({
  control,
  rowPrefix,
  index,
  label,
  actions,
  disabled,
}: {
  control: Control<MedicationPrescriptionModalValues>;
  rowPrefix: MedicationRowPrefix;
  index: number;
  label: string;
  actions: React.ReactNode;
  disabled?: boolean;
}) {
  const [startDateOpen, setStartDateOpen] = useState(false);

  return (
    <div className="relative flex flex-col lg:flex-row items-start gap-4 lg:gap-3 bg-gray-50 lg:bg-transparent p-4 lg:p-0 rounded-lg border lg:border-none border-gray-200">
      <div className="lg:hidden flex items-center justify-between w-full mb-2">
        <span className="font-semibold text-gray-700 text-sm">
          {label} {index + 1}
        </span>
        <div className="flex gap-2">{actions}</div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3 w-full lg:pl-3">
          <FormField
            control={control}
            name={`${rowPrefix}.formulary`}
            render={({ field }) => (
              <FormItem className="space-y-1.5 lg:space-y-0">
                <label className="lg:hidden text-xs font-medium text-gray-600">
                  Formulary
                </label>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger className="w-full h-10 text-sm lg:text-base">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MEDICATION_FORMULARY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${rowPrefix}.medication`}
            render={({ field }) => (
              <FormItem className="space-y-1.5 lg:space-y-0 sm:col-span-2 lg:col-span-2">
                <label className="lg:hidden text-xs font-medium text-gray-600">
                  Medication
                </label>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter medication"
                    className="w-full h-10 text-sm lg:text-base"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${rowPrefix}.dose`}
            render={({ field }) => (
              <FormItem className="space-y-1.5 lg:space-y-0">
                <label className="lg:hidden text-xs font-medium text-gray-600">
                  Dose
                </label>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Dose"
                    className="w-full h-10 text-sm lg:text-base"
                    disabled={disabled}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : e.target.value,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${rowPrefix}.unit`}
            render={({ field }) => (
              <FormItem className="space-y-1.5 lg:space-y-0">
                <label className="lg:hidden text-xs font-medium text-gray-600">
                  Unit
                </label>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger className="w-full h-10 text-sm lg:text-base">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MEDICATION_DOSE_UNIT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${rowPrefix}.interval`}
            render={({ field }) => (
              <FormItem className="space-y-1.5 lg:space-y-0">
                <label className="lg:hidden text-xs font-medium text-gray-600">
                  Frequency
                </label>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger className="w-full h-10 text-sm lg:text-base">
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MEDICATION_INTERVAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${rowPrefix}.duration`}
            render={({ field }) => (
              <FormItem className="space-y-1.5 lg:space-y-0">
                <label className="lg:hidden text-xs font-medium text-gray-600">
                  Duration
                </label>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Num"
                    className="w-full h-10 text-sm lg:text-base"
                    disabled={disabled}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : e.target.value,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${rowPrefix}.duration_unit`}
            render={({ field }) => (
              <FormItem className="space-y-1.5 lg:space-y-0">
                <label className="lg:hidden text-xs font-medium text-gray-600">
                  Duration Unit
                </label>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger className="w-full h-10 text-sm lg:text-base">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MEDICATION_DURATION_UNIT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:max-w-[240px] lg:pl-3">
          <FormField
            control={control}
            name={`${rowPrefix}.start_date`}
            render={({ field }) => {
              const selectedDate = parseMedicationStartDate(field.value);

              return (
                <FormItem className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">
                    Start Date
                  </label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={disabled}
                          title={
                            selectedDate
                              ? format(selectedDate, "PPPP")
                              : undefined
                          }
                          className={`w-full h-10 min-w-0 justify-start gap-2 px-3 text-left font-normal text-sm ${
                            !field.value ? "text-muted-foreground" : ""
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {selectedDate
                              ? format(selectedDate, "MMM d, yyyy")
                              : "Pick start date"}
                          </span>
                          <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (!date) return;
                          field.onChange(format(date, "yyyy-MM-dd"));
                          setStartDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <div className="mt-3 w-full space-y-1.5 lg:pl-3">
          <FormField
            control={control}
            name={`${rowPrefix}.order_instruction`}
            render={({ field }) => (
              <FormItem>
                <label className="text-xs font-medium text-gray-600">
                  Order Instruction
                </label>
                <FormControl>
                  <Textarea
                    placeholder="e.g. Take with food, avoid alcohol, specific timing instructions..."
                    className="min-h-[60px] text-sm lg:text-base resize-y"
                    disabled={disabled}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="hidden lg:flex gap-2 shrink-0">{actions}</div>
    </div>
  );
}

function ColumnHeader() {
  return (
    <div className="hidden lg:block mb-4 bg-gray-100 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="min-w-0 flex-1 grid grid-cols-8 gap-3 text-sm text-gray-700 font-semibold items-center">
          <div className="px-3 min-h-10 flex items-center">Formulary</div>
          <div className="col-span-2 px-3 min-h-10 flex items-center">
            Medication
          </div>
          <div className="px-3 min-h-10 flex items-center">Dose</div>
          <div className="px-3 min-h-10 flex items-center">Unit</div>
          <div className="px-3 min-h-10 flex items-center">Frequency</div>
          <div className="px-3 min-h-10 flex items-center">Duration</div>
          <div className="px-3 min-h-10 flex items-center">Duration Unit</div>
        </div>
        <div className="w-[88px]" />
      </div>
    </div>
  );
}

export function MedicationModal({
  onClose,
  consultationId,
}: MedicationModalProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const pendingSyncedRef = useRef(false);

  const form = useForm<MedicationPrescriptionModalValues>({
    resolver: zodResolver(medicationPrescriptionModalSchema),
    defaultValues: {
      pendingMedications: [],
      newMedications: [createEmptyMedicationRow()],
    },
    mode: "onSubmit",
  });

  const { fields: pendingFields, remove: removePending } = useFieldArray({
    control: form.control,
    name: "pendingMedications",
  });

  const {
    fields: newFields,
    append: appendNew,
    remove: removeNew,
  } = useFieldArray({
    control: form.control,
    name: "newMedications",
  });

  const { data: existingMedicationsRes, isLoading: isLoadingExisting } =
    useQuery({
      queryKey: ["consultation-medications", consultationId],
      queryFn: () => getMedicationsForConsultation(consultationId!),
      enabled: !!consultationId,
      retry: false,
    });

  const mapPendingRows = (
    items: Awaited<ReturnType<typeof getMedicationsForConsultation>>["data"],
  ) =>
    (items ?? [])
      .filter((medication) => !medication.assign_to_patient)
      .map((medication) => {
        try {
          return mapApiMedicationToRow(medication);
        } catch {
          return null;
        }
      })
      .filter((row): row is MedicationPrescriptionRowValues => row !== null);

  const syncPendingFromApi = (
    items: Awaited<ReturnType<typeof getMedicationsForConsultation>>["data"],
  ) => {
    form.setValue("pendingMedications", mapPendingRows(items), {
      shouldDirty: false,
    });
  };

  useEffect(() => {
    if (!existingMedicationsRes?.data || pendingSyncedRef.current) return;
    syncPendingFromApi(existingMedicationsRes.data);
    pendingSyncedRef.current = true;
  }, [existingMedicationsRes, form]);

  const { mutate: deleteMedication } = useMutation({
    mutationFn: (id: string) => deleteMedicationRecordReq(id),
    onMutate: (id) => setDeletingId(id),
    onSuccess: (_data, id) => {
      toast.success("Medication deleted");
      const index = form
        .getValues("pendingMedications")
        .findIndex((row) => row._id === id);
      if (index >= 0) removePending(index);
      queryClient.invalidateQueries({
        queryKey: ["consultation-medications", consultationId],
      });
      queryClient.invalidateQueries({ queryKey: ["medications_doc"] });
      queryClient.invalidateQueries({
        queryKey: ["medications", consultationId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete medication");
    },
    onSettled: () => setDeletingId(null),
  });

  const submitMedications = async (
    values: MedicationPrescriptionModalValues,
    assignToPatient: boolean,
  ) => {
    if (!consultationId) {
      toast.error("Consultation ID is missing. Please try again.");
      return;
    }

    const touchedNewMeds = values.newMedications.filter(isTouchedMedicationRow);

    if (assignToPatient) {
      setIsGenerating(true);
    } else {
      setIsSaving(true);
    }

    try {
      const patchPromises = values.pendingMedications.map((med) =>
        updateMedicationRecordReq(
          mapRowToApiPayload(med, assignToPatient),
          med._id!,
        ),
      );

      let createPromise: Promise<unknown> = Promise.resolve();
      if (touchedNewMeds.length > 0) {
        createPromise = createMedicationForConsultationReq(consultationId, {
          medications: touchedNewMeds.map((med) =>
            mapRowToApiPayload(
              med as MedicationPrescriptionRowValues,
              assignToPatient,
            ),
          ),
        });
      }

      await Promise.all([...patchPromises, createPromise]);

      toast.success(
        assignToPatient
          ? "Prescription generated successfully"
          : "Medications saved successfully",
      );

      pendingSyncedRef.current = false;
      const fresh = await queryClient.fetchQuery({
        queryKey: ["consultation-medications", consultationId],
        queryFn: () => getMedicationsForConsultation(consultationId),
      });

      form.reset({
        pendingMedications: mapPendingRows(fresh.data),
        newMedications: [createEmptyMedicationRow()],
      });
      pendingSyncedRef.current = true;

      queryClient.invalidateQueries({ queryKey: ["medications_doc"] });
      queryClient.invalidateQueries({
        queryKey: ["medications", consultationId],
      });
    } catch (error) {
      toast.error(
        (error as Error).message ||
          "Failed to save medications. Please try again.",
      );
    } finally {
      if (assignToPatient) {
        setIsGenerating(false);
      } else {
        setIsSaving(false);
      }
    }
  };

  const onInvalid = () => {
    toast.error("Please fix the highlighted medication fields");
  };

  const handleSave = form.handleSubmit(
    (values) => submitMedications(values, false),
    onInvalid,
  );

  const handleGenerate = form.handleSubmit(
    (values) => submitMedications(values, true),
    onInvalid,
  );

  const isBusy = isSaving || isGenerating || deletingId !== null;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-[780px] lg:max-w-[1100px] xl:max-w-[1400px] p-0 gap-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
        <DialogHeader className="px-4 sm:px-6 py-4 flex flex-row items-center justify-between border-b border-gray-200 space-y-0 shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">
            Prescription Builder
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[75vh]"
            onSubmit={(event) => event.preventDefault()}
          >
            {isLoadingExisting && (
              <div className="flex items-center justify-center py-8 text-gray-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading pending medications…</span>
              </div>
            )}

            {pendingFields.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Pill className="w-4 h-4 text-[#5164E8]" />
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    Pending Medications
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {pendingFields.length}
                  </span>
                </div>

                <ColumnHeader />

                <div className="space-y-4 lg:space-y-3">
                  {pendingFields.map((field, index) => {
                    const medicationId = form.getValues(
                      `pendingMedications.${index}._id`,
                    );

                    return (
                      <MedicationRowFields
                        key={field.id}
                        control={form.control}
                        rowPrefix={`pendingMedications.${index}`}
                        index={index}
                        label="Pending"
                        disabled={isBusy}
                        actions={
                          <button
                            type="button"
                            onClick={() => deleteMedication(medicationId!)}
                            className="p-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#FF5252] transition-colors disabled:opacity-50"
                            disabled={isBusy}
                            title="Delete medication"
                          >
                            {deletingId === medicationId ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        }
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <ColumnHeader />

            <div className="space-y-4 lg:space-y-3">
              {newFields.map((field, index) => (
                <MedicationRowFields
                  key={field.id}
                  control={form.control}
                  rowPrefix={`newMedications.${index}`}
                  index={index}
                  label="New"
                  disabled={isBusy}
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() => appendNew(createEmptyMedicationRow())}
                        className="p-2 bg-[#00C48C] text-white rounded-lg hover:bg-[#00B37E] transition-colors"
                        disabled={isBusy}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNew(index)}
                        className="p-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#FF5252] transition-colors disabled:opacity-50"
                        disabled={newFields.length === 1 || isBusy}
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          </form>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isBusy}
              className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-2 bg-[#5164E8] text-white rounded-lg hover:bg-[#3B4BCF] transition-all disabled:opacity-50 text-sm font-semibold shadow-sm"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Generate &amp; Send to Patient
            </button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
