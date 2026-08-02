import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Send, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  listReferralsForConsultationReq,
  updateReferralRecordReq,
} from "@/config/service/doctor.service";
import {
  isTouchedReferralRow,
  referralFormSchema,
  referralModalSchema,
  type ReferralFormValues,
  type ReferralModalValues,
  type ReferralRowValues,
} from "@/lib/validation-schemas";
import { SpecialistNameCombobox } from "@/shared/components/specialist-name-combobox.component.shared";

interface ReferralModalProps {
  onClose: () => void;
  consultationId: string;
}

type ReferralFieldPrefix = `pendingReferrals.${number}` | "newReferral";

const EMPTY_NEW_REFERRAL: Partial<ReferralFormValues> = {
  referred_doctor_name: "",
  specialist_name: "",
  hospital: "",
  referral_details: "",
};

function mapReferralFormToPayload(
  values: ReferralFormValues,
  assignToPatient: boolean,
) {
  return {
    specialist_name: values.specialist_name,
    hospital: values.hospital,
    referral_details: values.referral_details,
    referred_doctor_name: values.referred_doctor_name?.trim() || undefined,
    assign_to_patient: assignToPatient,
  };
}

function mapApiReferralToRow(
  referral: Awaited<
    ReturnType<typeof listReferralsForConsultationReq>
  >["data"][number],
): ReferralRowValues {
  return {
    _id: referral._id,
    referred_doctor_name: referral.referred_doctor_name || "",
    specialist_name: referral.specialist_name,
    hospital: referral.hospital,
    referral_details: referral.referral_details,
  };
}

function ReferralFormFields({
  control,
  namePrefix,
  disabled,
}: {
  control: Control<ReferralModalValues>;
  namePrefix: ReferralFieldPrefix;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={`${namePrefix}.referred_doctor_name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base text-gray-700 font-medium">
              Doctor&apos;s Name
            </FormLabel>
            <FormDescription className="text-xs text-gray-500">
              Only fill if sending to a specific known doctor
            </FormDescription>
            <FormControl>
              <Input
                type="text"
                placeholder="Enter doctor's full name"
                className="h-10 text-sm sm:text-base bg-white border-gray-300 focus-visible:ring-[#5164E8]"
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
        name={`${namePrefix}.specialist_name`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base text-gray-700 font-medium">
              Specialist Name *
            </FormLabel>
            <SpecialistNameCombobox
              value={field.value ?? ""}
              onChange={field.onChange}
              error={fieldState.error?.message}
              placeholder="Search or select specialist e.g. Gynaecologist"
              disabled={disabled}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${namePrefix}.hospital`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base text-gray-700 font-medium">
              Hospital Name *
            </FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="Enter hospital name"
                className="h-10 text-sm sm:text-base bg-white border-gray-300 focus-visible:ring-[#5164E8]"
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
        name={`${namePrefix}.referral_details`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base text-gray-700 font-medium">
              Referral Details *
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
    </div>
  );
}

export function ReferralModal({ onClose, consultationId }: ReferralModalProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const pendingSyncedRef = useRef(false);

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

  const syncPendingFromApi = (
    items: Awaited<ReturnType<typeof listReferralsForConsultationReq>>["data"],
  ) => {
    form.setValue("pendingReferrals", mapPendingRows(items), {
      shouldDirty: false,
    });
  };

  useEffect(() => {
    if (!referralsRes?.data || pendingSyncedRef.current) return;
    syncPendingFromApi(referralsRes.data);
    pendingSyncedRef.current = true;
  }, [referralsRes, form]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["referrals", consultationId] });

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
    onError: () => toast.error("Failed to delete referral"),
    onSettled: () => setDeletingId(null),
  });

  const submitReferral = async (
    values: ReferralModalValues,
    assignToPatient: boolean,
  ) => {
    const hasNewReferral = isTouchedReferralRow(values.newReferral);

    if (values.pendingReferrals.length === 0 && !hasNewReferral) {
      toast.error("Add referral details before saving");
      return;
    }

    if (assignToPatient) {
      setIsGenerating(true);
    } else {
      setIsSaving(true);
    }

    try {
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

      pendingSyncedRef.current = false;
      const fresh = await queryClient.fetchQuery({
        queryKey: ["referrals", consultationId],
        queryFn: () => listReferralsForConsultationReq(consultationId),
      });

      form.reset({
        pendingReferrals: mapPendingRows(fresh.data),
        newReferral: { ...EMPTY_NEW_REFERRAL },
      });
      pendingSyncedRef.current = true;
      invalidate();
    } catch (error) {
      toast.error(
        (error as Error).message ||
          "Failed to save referral. Please try again.",
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
        `pendingReferrals.${index}.hospital`,
        `pendingReferrals.${index}.referral_details`,
      ]);
      toast.error("Please complete all required fields before sending");
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
        (error as Error).message ||
          "Failed to send referral to patient. Please try again.",
      );
    } finally {
      setSendingId(null);
    }
  };

  const onInvalid = () => {
    toast.error("Please fix the highlighted referral fields");
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
                        namePrefix={`pendingReferrals.${index}`}
                        disabled={isBusy}
                      />
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
              />
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
