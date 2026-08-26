import { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createTreatmentPlanForConsultationReq,
  updateTreatmentPlanForConsultationReq,
  getTreatmentPlanForConsultationReq,
} from "@/config/service/doctor.service";
import { Loader2 } from "lucide-react";
import { ConsultationMode } from "../../pages/view-consultation-space.page.doctor";
import { useDebouncedAutosave } from "@/shared/hooks/use-debounced-autosave";
import AutosaveIndicator from "@/shared/components/autosave-indicator.component";

interface TreatmentPlanFormProps {
  consultationId?: string;
  mode?: ConsultationMode;
  onCancel: () => void;
  onSave: () => void;
  onSaveAndContinue: () => void;
}

type TreatmentPlanData = {
  _id?: string;
  treatment_plan_details: string;
};

// ── Outer shell: fetches existing data, shows spinner, then renders inner ──
export function TreatmentPlanForm({
  consultationId,
  mode = "edit",
  onCancel,
  onSave,
  onSaveAndContinue,
}: TreatmentPlanFormProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["consultation-treatment", consultationId],
    queryFn: () => getTreatmentPlanForConsultationReq(consultationId!),
    enabled: !!consultationId,
    retry: false,
  });

  return (
    <TreatmentPlanInner
      consultationId={consultationId}
      existingData={data?.data}
      isLoading={isLoading}
      mode={mode}
      onCancel={onCancel}
      onSave={onSave}
      onSaveAndContinue={onSaveAndContinue}
    />
  );
}

// ── Inner component: owns all state, draft persistence, and mutations ──
function TreatmentPlanInner({
  consultationId,
  existingData,
  isLoading,
  mode,
  onCancel,
  onSave,
  onSaveAndContinue,
}: {
  consultationId?: string;
  existingData?: Partial<TreatmentPlanData>;
  isLoading: boolean;
  mode: ConsultationMode;
  onCancel: () => void;
  onSave: () => void;
  onSaveAndContinue: () => void;
}) {
  // Derive intent from mode — single source of truth, no scattered booleans
  const isLocked = mode === "locked"; // entire form non-interactive
  const isAddendumOnly = mode === "addendum"; // main field locked, addendum editable
  const isEditable = mode === "edit"; // full edit access

  const draftKey = `draft-consultation-${consultationId}-treatment`;

  const [treatmentDetails, setTreatmentDetails] = useState<string>(() => {
    // Draft restoration only makes sense when the doctor can actually edit
    if (isEditable) {
      const saved = localStorage.getItem(draftKey);
      if (saved) return saved;
    }
    return existingData?.treatment_plan_details ?? "";
  });

  const [addendumText, setAddendumText] = useState("");
  const [recordId, setRecordId] = useState(existingData?._id);
  const [isContinuePending, setIsContinuePending] = useState(false);

  const queryClient = useQueryClient();
  const hydratedConsultationRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const hydrationKey = consultationId ?? "new";
    if (isLoading || hydratedConsultationRef.current === hydrationKey) return;

    if (isEditable) {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        setTreatmentDetails(saved);
        setRecordId(existingData?._id);
        hydratedConsultationRef.current = hydrationKey;
        return;
      }
    }

    setTreatmentDetails(existingData?.treatment_plan_details ?? "");
    setRecordId(existingData?._id);
    hydratedConsultationRef.current = hydrationKey;
  }, [consultationId, draftKey, existingData, isEditable, isLoading]);

  const loadingFieldClass = isLoading
    ? "animate-pulse !border-[#B8C3F5] !bg-[#EEF2FF] text-transparent placeholder:text-transparent"
    : "";

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation({
    mutationFn: (
      data: TreatmentPlanData & { status: "COMPLETED" | "INCOMPLETE" },
    ) => createTreatmentPlanForConsultationReq(data, consultationId!),
  });

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: (
      data: TreatmentPlanData & { status: "COMPLETED" | "INCOMPLETE" },
    ) => updateTreatmentPlanForConsultationReq(data, recordId!),
  });

  const isPending = isLoading || isCreating || isUpdating;

  const handleSaveSubmit = useCallback(
    async (
      completed: boolean,
      silent = false,
      nextValue = treatmentDetails,
    ) => {
      if (!consultationId || isPending) return false;

      const payload = {
        treatment_plan_details: nextValue,
        status: (completed ? "COMPLETED" : "INCOMPLETE") as
          | "COMPLETED"
          | "INCOMPLETE",
      };

      if (completed && !silent) {
        setIsContinuePending(true);
      }

      try {
        const response = recordId
          ? await updateMutation(payload)
          : await createMutation(payload);

        if (response.data?._id) {
          setRecordId(response.data._id);
        }

        localStorage.removeItem(draftKey);
        queryClient.setQueryData(
          ["consultation-treatment", consultationId],
          response,
        );

        if (!silent) {
          toast.success(
            recordId
              ? "Treatment plan updated successfully"
              : "Treatment plan saved successfully",
          );

          if (completed) {
            onSaveAndContinue();
          } else {
            onSave();
          }
        }

        return true;
      } catch (error) {
        if (!silent) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to save treatment plan",
          );
        }
        return false;
      } finally {
        if (completed && !silent) {
          setIsContinuePending(false);
        }
      }
    },
    [
      consultationId,
      createMutation,
      draftKey,
      isPending,
      onSave,
      onSaveAndContinue,
      queryClient,
      recordId,
      treatmentDetails,
      updateMutation,
    ],
  );

  const { autosaveState } = useDebouncedAutosave({
    value: treatmentDetails,
    enabled: isEditable && !!consultationId,
    isSaving: isPending,
    onSave: async (nextValue) => {
      if (!nextValue.trim() && !recordId) return false;
      return handleSaveSubmit(false, true, nextValue);
    },
  });

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 space-y-5 shadow-sm border border-[#E5E7EB]">
      {isEditable && (
        <div className="flex justify-end">
          <AutosaveIndicator state={autosaveState} />
        </div>
      )}
      {/* ── Main treatment plan field ── */}
      <div>
        <Label className="block text-[#374151] mb-2 text-xs">
          Treatment Plan Details
        </Label>
        <Textarea
          value={treatmentDetails}
          onChange={(e) => {
            if (!isEditable) return;
            setTreatmentDetails(e.target.value);
            localStorage.setItem(draftKey, e.target.value);
          }}
          className={`min-h-[320px] !text-xs ${loadingFieldClass}`}
          placeholder="Enter detailed treatment plan, advice, follow-up instructions..."
          // Locked when the page is fully locked OR when only the addendum is editable
          disabled={isLoading || isLocked || isAddendumOnly}
        />
        <p className="text-sm text-[#6B7280] mt-2 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          This will be shared with the patient
        </p>
      </div>

      {/* ── Addendum section: visible only when the assigned doctor arrives
           via the patient route (addendum mode) ── */}
      {isAddendumOnly && (
        <div className="pt-4 border-t border-[#E5E7EB]">
          <Label className="block text-[#374151] mb-2 font-semibold text-xs">
            Addendum
          </Label>
          <Textarea
            value={addendumText}
            onChange={(e) => setAddendumText(e.target.value)}
            className="min-h-[80px] !text-xs"
            placeholder="Enter addendum notes here..."
          />
        </div>
      )}

      {/* ── Action buttons: hidden when fully locked ── */}
      {!isLocked && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#E5E7EB]">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-6 py-2.5 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg hover:bg-[#F9FAFB] transition-colors !text-xs disabled:opacity-50"
          >
            Cancel
          </button>

          {isAddendumOnly && (
            <button
              onClick={() => void handleSaveSubmit(false)}
              disabled={isPending}
              className="px-6 py-2.5 bg-[#F3F4F6] text-[#374151] rounded-lg hover:bg-[#E5E7EB] transition-colors border border-[#D1D5DB] !text-xs disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && !isContinuePending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Save Addendum
            </button>
          )}

          {!isAddendumOnly && (
            <button
              onClick={() => void handleSaveSubmit(true)}
              disabled={isPending || isContinuePending}
              className="px-6 py-2.5 bg-[#5164E8] text-white rounded-lg hover:bg-[#4153D6] transition-colors shadow-sm !text-xs disabled:opacity-50 flex items-center gap-2"
            >
              {isContinuePending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Save and Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
}
