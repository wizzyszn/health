import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Control,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Trash2,
  Send,
  FileText,
  Paperclip,
  FileImage,
  CheckSquare,
  Square,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createReferralForConsultationReq,
  deleteReferralRecordReq,
  getPatientInvestigationHistoryReq,
  listReferralsForConsultationReq,
  updateReferralRecordReq,
} from "@/config/service/doctor.service";
import { getPatientActiveMedicationHistory } from "@/config/service/patient.service";
import {
  isTouchedReferralRow,
  referralFormSchema,
  referralModalSchema,
  type ReferralFormValues,
  type ReferralModalValues,
  type ReferralRowValues,
} from "@/lib/validation-schemas";
import { mapReferralFormToPayload } from "@/lib/referral-payload";
import {
  APPROVED_HOSPITALS,
  REFERRAL_SPECIALTIES,
  normalizeLegacySpecialty,
  type ReferralSpecialty,
} from "@/shared/constants/referral-catalogs.constants";

interface ReferralModalProps {
  onClose: () => void;
  consultationId: string;
  /** Patient of the consultation — enables the investigation attachments selector. */
  patientId?: string;
}

type ReferralFieldPrefix = `pendingReferrals.${number}` | "newReferral";

const EMPTY_NEW_REFERRAL: Partial<ReferralFormValues> = {
  specialty: "",
  specialist_name: "",
  hospital: "",
  hospital_address: [],
  attachment_investigation_ids: [],
  referral_details: "",
  current_medications: "",
};

function mapApiReferralToRow(
  referral: Awaited<
    ReturnType<typeof listReferralsForConsultationReq>
  >["data"][number],
): ReferralRowValues {
  return {
    _id: referral._id,
    specialty: normalizeLegacySpecialty(referral.specialty),
    specialist_name: referral.specialist_name,
    hospital: referral.hospital,
    hospital_address: referral.hospital_address ?? [],
    attachment_investigation_ids: referral.attachment_investigation_ids ?? [],
    referral_details: referral.referral_details,
    current_medications: referral.current_medications ?? "",
  };
}

/* Field order per stakeholder revision (Aug 2026):
 *   1. Specialist Name   — the doctor's actual name ("Dr. Okoh")
 *   2. Specialty         — what they practise ("Cardiologist")
 *   3. Clinical summary / reason for referral
 *   4. Attach uploaded results
 * Hospital select stays above the fold with Specialty for addressing context.
 */
function ReferralFormFields({
  control,
  namePrefix,
  disabled,
  onHospitalChange,
}: {
  control: Control<ReferralModalValues>;
  namePrefix: ReferralFieldPrefix;
  disabled?: boolean;
  onHospitalChange?: (hospitalName: string | undefined) => void;
}) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={`${namePrefix}.specialist_name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base text-gray-700 font-medium">
              Specialist Name
            </FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="e.g. Dr. Okoh"
                className="h-10 text-sm sm:text-base bg-white border-gray-300 focus-visible:ring-[#5164E8]"
                disabled={disabled}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500">
              Full name of the doctor receiving the patient.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={`${namePrefix}.specialty`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base text-gray-700 font-medium">
                Specialty *
              </FormLabel>
              <Select
                value={
                  field.value &&
                  REFERRAL_SPECIALTIES.includes(
                    field.value as ReferralSpecialty,
                  )
                    ? field.value
                    : "__legacy"
                }
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className="h-10 w-full text-sm sm:text-base bg-white border-gray-300 focus-visible:ring-[#5164E8]">
                    <SelectValue placeholder="e.g. Cardiologist" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {REFERRAL_SPECIALTIES.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-xs text-gray-500">
                What the specialist practices.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`${namePrefix}.hospital`}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base text-gray-700 font-medium">
                Hospital *
              </FormLabel>
              <Select
                value={
                  APPROVED_HOSPITALS.some(
                    (hospital) => hospital.name === field.value,
                  )
                    ? (field.value ?? undefined)
                    : "__custom"
                }
                onValueChange={(value) => {
                  if (value === "__custom") return;
                  field.onChange(value);
                  onHospitalChange?.(value);
                }}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger
                    className={
                      "h-10 w-full text-sm sm:text-base bg-white focus-visible:ring-[#5164E8] " +
                      (fieldState.error ? "border-red-500" : "border-gray-300")
                    }
                  >
                    <SelectValue placeholder="Select hospital" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {APPROVED_HOSPITALS.map((hospital) => (
                    <SelectItem key={hospital.id} value={hospital.name}>
                      {hospital.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <HospitalAddressHint control={control} namePrefix={namePrefix} />
              {/* Free-text fallback keeps legacy non-catalog values intact */}
              {!APPROVED_HOSPITALS.some(
                (hospital) => hospital.name === field.value,
              ) && (
                <FormControl>
                  <input
                    type="hidden"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name={`${namePrefix}.referral_details`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base text-gray-700 font-medium">
              Clinical Summary / Reason for Referral *
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter detailed reason for referral"
                className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-y bg-white border-gray-300 focus-visible:ring-[#5164E8]"
                disabled={disabled}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${namePrefix}.current_medications`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base text-gray-700 font-medium">
              Current Medications
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="One medication per line, e.g.&#10;Lisinopril 10mg once daily&#10;Aspirin 75mg once daily"
                className="min-h-[80px] text-sm sm:text-base resize-y bg-white border-gray-300 focus-visible:ring-[#5164E8]"
                disabled={disabled}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500">
              Optional. Printed verbatim on the letter under Current
              Medications; leave blank to fall back to recorded medications.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

/** Auto-filled postal address of the picked catalog hospital (never typed). */
function HospitalAddressHint({
  control,
  namePrefix,
}: {
  control: Control<ReferralModalValues>;
  namePrefix: ReferralFieldPrefix;
}) {
  const hospitalName = useWatch({
    control,
    name: `${namePrefix}.hospital` as never,
  }) as string | undefined;
  const selected = APPROVED_HOSPITALS.find(
    (hospital) => hospital.name === hospitalName,
  );

  if (!selected) return null;
  return (
    <p className="text-xs text-gray-500 break-words flex items-start gap-1">
      <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
      <span>{selected.addressLines.join(", ")}</span>
    </p>
  );
}

export function ReferralModal({
  onClose,
  consultationId,
  patientId,
}: ReferralModalProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<ReferralModalValues>({
    resolver: zodResolver(referralModalSchema),
    defaultValues: {
      pendingReferrals: [],
      newReferral: EMPTY_NEW_REFERRAL,
    },
    mode: "onSubmit",
  });

  const { fields: pendingFields, remove: removePending } = useFieldArray({
    control: form.control,
    name: "pendingReferrals",
  });

  const { data: referralsRes, isLoading: isFetching } = useQuery({
    queryKey: ["referrals", consultationId],
    queryFn: () => listReferralsForConsultationReq(consultationId),
    enabled: !!consultationId,
  });

  // Patient's active medications — used to prefill the Current Medications
  // field so the doctor can see them when writing the referral letter.
  // The API resolves the patient from the auth token, so no patientId param needed.
  const { data: patientMedsRes } = useQuery({
    queryKey: ["patient-active-medications"],
    queryFn: getPatientActiveMedicationHistory,
    enabled: !!consultationId,
  });

  /* Investigations with uploaded results — the attachments pool. */
  const { data: investigationsRes } = useQuery({
    queryKey: ["patient-investigation-history", patientId],
    queryFn: () =>
      getPatientInvestigationHistoryReq(patientId!, { perPage: "50" }),
    enabled: !!patientId,
  });

  const attachableInvestigations = useMemo(() => {
    const groups = investigationsRes?.data.groups ?? [];
    return groups.flatMap((group) =>
      group.investigations.filter(
        (investigation) => (investigation.result_images ?? []).length > 0,
      ),
    );
  }, [investigationsRes]);

  /** Hospital pick → hidden address lines (auto-filled, never typed). */
  const syncHospitalAddress = (
    namePrefix: ReferralFieldPrefix,
    hospitalName: string | undefined,
  ) => {
    const hospital = APPROVED_HOSPITALS.find(
      (candidate) => candidate.name === hospitalName,
    );
    // react-hook-form's template-literal Path type can't express a runtime
    // union of field prefixes, so route through a narrowed signature.
    const setArrayValue = form.setValue as unknown as (
      path: string,
      value: string[],
      options?: { shouldDirty?: boolean },
    ) => void;
    setArrayValue(
      `${namePrefix}.hospital_address`,
      hospital ? [...hospital.addressLines] : [],
      { shouldDirty: true },
    );
  };

  const setAttachmentIds = (namePrefix: ReferralFieldPrefix, ids: string[]) => {
    const setArrayValue = form.setValue as unknown as (
      path: string,
      value: string[],
      options?: { shouldDirty?: boolean },
    ) => void;
    setArrayValue(`${namePrefix}.attachment_investigation_ids`, ids, {
      shouldDirty: true,
    });
  };

  const mapPendingRows = (
    items: Awaited<ReturnType<typeof listReferralsForConsultationReq>>["data"],
  ) =>
    (items ?? [])
      .filter((referral) => {
        if (referral.assign_to_patient === true) return false;
        if (referral.assign_to_patient === false) return true;
        return !referral.user_id;
      })
      .map(mapApiReferralToRow);

  const syncPendingFromApi = useCallback(
    (
      items: Awaited<
        ReturnType<typeof listReferralsForConsultationReq>
      >["data"],
    ) => {
      form.setValue("pendingReferrals", mapPendingRows(items), {
        shouldDirty: false,
      });
    },
    [form],
  );

  useEffect(() => {
    if (!referralsRes?.data) return;
    syncPendingFromApi(referralsRes.data);
  }, [referralsRes?.data, form, syncPendingFromApi]);

  // Prefill Current Medications with the patient's active medications.
  useEffect(() => {
    if (!patientMedsRes?.data || patientMedsRes.data.length === 0) return;
    const medsText = patientMedsRes.data.map((m) => m.medication).join("\n");
    form.setValue("newReferral.current_medications", medsText);
  }, [patientMedsRes?.data, form]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["referrals", consultationId] });
    // Keeps the consultation-space sidebar history (and its detail sheet) in step
    // with edits made here.
    queryClient.invalidateQueries({ queryKey: ["patient-referral-history"] });
    queryClient.invalidateQueries({ queryKey: ["patient-referral-record"] });
  };

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteReferralRecordReq(id),
    onMutate: (id) => setDeletingId(id),
    onSuccess: (_data, id) => {
      toast.success("Referral deleted");
      const index = form
        .getValues("pendingReferrals")
        .findIndex((referral) => referral._id === id);
      if (index >= 0) removePending(index);
      invalidate();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to delete referral")),
    onSettled: () => setDeletingId(null),
  });

  const submitReferral = async (
    values: ReferralModalValues,
    assignToPatient: boolean,
  ) => {
    const hasNewReferral = isTouchedReferralRow(values.newReferral);

    if (values.pendingReferrals.length === 0 && !hasNewReferral) {
      toast.warning("Add referral details before saving");
      return;
    }

    if (assignToPatient) {
      setIsGenerating(true);
    } else {
      setIsSaving(true);
    }

    try {
      // Fire API calls in background — don't block UI on them.
      const patchPromises = values.pendingReferrals.map((referral) =>
        updateReferralRecordReq(
          referral._id!,
          mapReferralFormToPayload(referral, assignToPatient),
        ),
      );

      let createPromise: Promise<unknown> = Promise.resolve();
      if (hasNewReferral) {
        createPromise = createReferralForConsultationReq(
          consultationId,
          mapReferralFormToPayload(
            values.newReferral as ReferralFormValues,
            assignToPatient,
          ),
        );
      }

      await Promise.all([...patchPromises, createPromise]);

      toast.success(
        assignToPatient
          ? "Referral generated & sent to patient"
          : "Referral saved",
      );

      // Save appeared immediately: merge new draft into pending list,
      // clear new-referral inputs.
      form.reset({
        pendingReferrals: [
          ...values.pendingReferrals,
          ...(hasNewReferral
            ? [
                mapReferralFormToPayload(
                  values.newReferral as ReferralFormValues,
                  false,
                ),
              ]
            : []),
        ],
        newReferral: { ...EMPTY_NEW_REFERRAL },
      });

      // Invalidate queries so the background useEffect syncs real server
      // data (replacing draft entries with real _ids from the server).
      queryClient.invalidateQueries({
        queryKey: ["referrals", consultationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["patient-referral-history"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patient-referral-record"],
      });
      queryClient.invalidateQueries({ queryKey: ["medications_doc"] });
      queryClient.invalidateQueries({
        queryKey: ["medications", consultationId],
      });
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Failed to save referral. Please try again."),
      );
    } finally {
      setIsSaving(false);
      setIsGenerating(false);
    }
  };

  const handleSendPendingReferral = async (
    referralId: string,
    index: number,
  ) => {
    const row = form.getValues(`pendingReferrals.${index}`);
    const result = referralFormSchema.safeParse(row);

    if (!result.success) {
      await form.trigger([
        `pendingReferrals.${index}.specialist_name`,
        `pendingReferrals.${index}.specialty`,
        `pendingReferrals.${index}.hospital`,
        `pendingReferrals.${index}.referral_details`,
      ]);
      toast.warning("Please complete all required fields before sending");
      return;
    }

    setSendingId(referralId);
    try {
      await updateReferralRecordReq(
        referralId,
        mapReferralFormToPayload(result.data, true),
      );
      toast.success("Referral sent to patient");
      removePending(index);
      invalidate();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Failed to send referral to patient. Please try again.",
        ),
      );
    } finally {
      setSendingId(null);
    }
  };

  const onInvalid = () => {
    toast.warning("Please fix the highlighted referral fields");
  };

  const handleSave = form.handleSubmit(
    (values) => submitReferral(values, false),
    onInvalid,
  );

  const handleGenerate = form.handleSubmit(
    (values) => submitReferral(values, true),
    onInvalid,
  );

  const isBusy =
    isSaving || isGenerating || deletingId !== null || sendingId !== null;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[700px] w-[95vw] p-0 gap-0 overflow-hidden bg-white max-h-[90vh] flex flex-col rounded-lg">
        <DialogHeader className="px-4 sm:px-6 py-4 border-b border-gray-200 space-y-0 shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">
            Referral
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
            onSubmit={(event) => event.preventDefault()}
          >
            {isFetching && (
              <div className="flex items-center justify-center py-6 text-gray-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#5164E8]" />
                <span className="text-sm">Loading pending referrals…</span>
              </div>
            )}

            {pendingFields.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#5164E8]" />
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    Pending Referrals
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {pendingFields.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Edit any saved referral below. Send one at a time, or use the
                  footer to save or send all together.
                </p>

                {pendingFields.map((field, index) => {
                  const referralId = form.getValues(
                    `pendingReferrals.${index}._id`,
                  );
                  const namePrefix =
                    `pendingReferrals.${index}` as ReferralFieldPrefix;

                  return (
                    <div
                      key={field.id}
                      className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Pending referral {index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleSendPendingReferral(referralId!, index)
                            }
                            disabled={
                              isBusy ||
                              deletingId === referralId ||
                              sendingId === referralId
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-[#5164E8]/30 bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-semibold text-[#5164E8] hover:bg-[#E0E7FF] transition-colors disabled:opacity-40 whitespace-nowrap"
                            title="Send this referral to the patient"
                          >
                            {sendingId === referralId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Send to Patient
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(referralId!)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                            aria-label="Delete referral"
                            disabled={isBusy}
                          >
                            {deletingId === referralId ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <ReferralFormFields
                        control={form.control}
                        namePrefix={namePrefix}
                        disabled={isBusy}
                        onHospitalChange={(hospitalName) =>
                          syncHospitalAddress(namePrefix, hospitalName)
                        }
                      />

                      {attachableInvestigations.length > 0 && (
                        <AttachmentsPickerSection
                          control={form.control}
                          namePrefix={namePrefix}
                          investigations={attachableInvestigations}
                          disabled={isBusy}
                          onChange={(ids) => setAttachmentIds(namePrefix, ids)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">
                Add new referral
              </p>
              <ReferralFormFields
                control={form.control}
                namePrefix="newReferral"
                disabled={isBusy}
                onHospitalChange={(hospitalName) =>
                  syncHospitalAddress("newReferral", hospitalName)
                }
              />

              {attachableInvestigations.length > 0 && (
                <AttachmentsPickerSection
                  control={form.control}
                  namePrefix="newReferral"
                  investigations={attachableInvestigations}
                  disabled={isBusy}
                  onChange={(ids) => setAttachmentIds("newReferral", ids)}
                />
              )}
            </div>
          </form>
        </Form>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="w-full sm:w-auto px-4 py-2 sm:px-6 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 text-sm font-medium"
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
      </DialogContent>
    </Dialog>
  );
}

/* ─── Attachments picker ─────────────────────────────────────────────────── */

interface AttachableInvestigation {
  _id: string;
  name: string;
  category?: string | null;
  createdAt?: string;
  result_images?: string[];
}

function formatUploadDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AttachmentsPickerSection({
  control,
  namePrefix,
  investigations,
  disabled,
  onChange,
}: {
  control: Control<ReferralModalValues>;
  namePrefix: ReferralFieldPrefix;
  investigations: AttachableInvestigation[];
  disabled?: boolean;
  /** Receives the full next id list — callers persist it wholesale. */
  onChange: (ids: string[]) => void;
}) {
  const watchedIds = useWatch({
    control,
    name: `${namePrefix}.attachment_investigation_ids` as never,
  }) as string[] | undefined;
  const selectedIds = watchedIds ?? [];
  const selectedCount = selectedIds.length;

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((existing) => existing !== id)
        : [...selectedIds, id],
    );
  };

  const toggleAll = () => {
    onChange(
      selectedCount === investigations.length
        ? []
        : investigations.map((investigation) => investigation._id),
    );
  };

  const allSelected = selectedCount === investigations.length;

  return (
    <FormField
      control={control}
      name={`${namePrefix}.attachment_investigation_ids`}
      render={() => (
        <FormItem>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Header bar: label, live count pill, select-all */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="w-4 h-4 text-gray-500 shrink-0" />
                <FormLabel className="text-sm sm:text-base text-gray-700 font-medium truncate">
                  Attach uploaded results
                </FormLabel>
                <span
                  className={
                    "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                    (selectedCount > 0
                      ? "bg-[#EEF2FF] text-[#5164E8]"
                      : "bg-gray-200 text-gray-500")
                  }
                >
                  {selectedCount}/{investigations.length} selected
                </span>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                disabled={disabled}
                className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-[#5164E8] hover:text-[#3B4BCF] disabled:opacity-40"
              >
                {allSelected ? (
                  <>
                    <Square className="h-3.5 w-3.5" /> Clear all
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3.5 w-3.5" /> Select all
                  </>
                )}
              </button>
            </div>

            {/* Card grid — each upload is a tappable card, not a bare checkbox row */}
            <div className="max-h-56 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {investigations.map((investigation) => {
                const checked = selectedIds.includes(investigation._id);
                const fileCount = (investigation.result_images ?? []).length;
                const uploadedLabel = formatUploadDate(investigation.createdAt);

                return (
                  <div
                    key={investigation._id}
                    role="checkbox"
                    aria-checked={checked}
                    tabIndex={disabled ? -1 : 0}
                    aria-disabled={disabled || undefined}
                    onClick={() => {
                      if (!disabled) toggle(investigation._id);
                    }}
                    onKeyDown={(event) => {
                      if (disabled) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggle(investigation._id);
                      }
                    }}
                    className={
                      "group relative flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5164E8] " +
                      (checked
                        ? "border-[#5164E8] bg-[#EEF2FF]/60 ring-1 ring-[#5164E8]"
                        : "border-gray-200 bg-white hover:border-[#5164E8]/40 hover:bg-gray-50") +
                      (disabled ? " opacity-50 pointer-events-none" : "")
                    }
                  >
                    <span className="mt-0.5 shrink-0">
                      {checked ? (
                        <CheckSquare className="h-4 w-4 text-[#5164E8]" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-300 group-hover:text-[#5164E8]/60" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          "text-sm font-medium truncate " +
                          (checked ? "text-[#4A56C8]" : "text-gray-800")
                        }
                      >
                        {investigation.name}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-0.5">
                          <FileImage className="h-3 w-3" />
                          {fileCount} {fileCount === 1 ? "file" : "files"}
                        </span>
                        {investigation.category ? (
                          <span>· {investigation.category}</span>
                        ) : null}
                        {uploadedLabel ? <span>· {uploadedLabel}</span> : null}
                      </p>
                    </div>
                    {checked && (
                      <span className="absolute top-1.5 right-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#5164E8]">
                        <svg
                          viewBox="0 0 12 12"
                          aria-hidden="true"
                          className="h-2.5 w-2.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            d="M2 6.5 4.8 9 10 3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <FormDescription className="text-xs text-gray-500">
            Tap a card to attach or remove it. Selected uploads are appended to
            the referral letter PDF as pages.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
