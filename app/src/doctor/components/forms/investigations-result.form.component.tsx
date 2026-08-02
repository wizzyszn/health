import { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createInvestigationForConsultationReq,
  updateInvestigationForConsultationReq,
  getInvestigationForConsultationReq,
} from "@/config/service/doctor.service";
import { Loader2 } from "lucide-react";
import { ConsultationMode } from "../../pages/view-consultation-space.page.doctor";
import { useDebouncedAutosave } from "@/shared/hooks/use-debounced-autosave";
import AutosaveIndicator from "@/shared/components/autosave-indicator.component";

interface InvestigationResultsFormProps {
  consultationId?: string;
  mode?: ConsultationMode;
  onCancel: () => void;
  onSave: () => void;
  onSaveAndContinue: () => void;
}

type InvestigationData = {
  _id?: string;
  blood_test: string;
  microbiology: string;
  radiology: string;
  cardiovascular: string;
  procedures: string;
  others: string;
};

// ── Outer shell: fetches existing data, shows spinner, then renders inner ──
export function InvestigationResultsForm({
  consultationId,
  mode = "edit",
  onCancel,
  onSave,
  onSaveAndContinue,
}: InvestigationResultsFormProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["consultation-investigation", consultationId],
    queryFn: () => getInvestigationForConsultationReq(consultationId!),
    enabled: !!consultationId,
    retry: false,
  });

  return (
    <InvestigationResultsInner
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
function InvestigationResultsInner({
  consultationId,
  existingData,
  isLoading,
  mode,
  onCancel,
  onSave,
  onSaveAndContinue,
}: {
  consultationId?: string;
  existingData?: Partial<InvestigationData>;
  isLoading: boolean;
  mode: ConsultationMode;
  onCancel: () => void;
  onSave: () => void;
  onSaveAndContinue: () => void;
}) {
  // Derive intent from mode — single source of truth
  const isLocked = mode === "locked"; // entire form non-interactive
  const isAddendumOnly = mode === "addendum"; // all fields locked, addendum editable
  const isEditable = mode === "edit"; // full edit access

  const draftKey = `draft-consultation-${consultationId}-investigation`;

  const [formData, setFormData] = useState<InvestigationData>(() => {
    // Draft restoration only applies when the doctor can actually edit
    if (isEditable) {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse draft from localStorage", e);
        }
      }
    }
    return {
      blood_test: existingData?.blood_test ?? "",
      microbiology: existingData?.microbiology ?? "",
      radiology: existingData?.radiology ?? "",
      cardiovascular: existingData?.cardiovascular ?? "",
      procedures: existingData?.procedures ?? "",
      others: existingData?.others ?? "",
    };
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
        try {
          setFormData(JSON.parse(saved));
          setRecordId(existingData?._id);
          hydratedConsultationRef.current = hydrationKey;
          return;
        } catch (e) {
          console.error("Failed to parse draft from localStorage", e);
        }
      }
    }

    setFormData({
      blood_test: existingData?.blood_test ?? "",
      microbiology: existingData?.microbiology ?? "",
      radiology: existingData?.radiology ?? "",
      cardiovascular: existingData?.cardiovascular ?? "",
      procedures: existingData?.procedures ?? "",
      others: existingData?.others ?? "",
    });
    setRecordId(existingData?._id);
    hydratedConsultationRef.current = hydrationKey;
  }, [consultationId, draftKey, existingData, isEditable, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isEditable) return;
    setFormData((prev) => {
      const updated = { ...prev, [e.target.name]: e.target.value };
      localStorage.setItem(draftKey, JSON.stringify(updated));
      return updated;
    });
  };

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation({
    mutationFn: (
      data: InvestigationData & { status: "COMPLETED" | "INCOMPLETE" },
    ) => createInvestigationForConsultationReq(data, consultationId!),
  });

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: (
      data: Partial<InvestigationData> & { status: "COMPLETED" | "INCOMPLETE" },
    ) => updateInvestigationForConsultationReq(data, recordId!),
  });

  const isPending = isLoading || isCreating || isUpdating;

  const handleSaveSubmit = useCallback(
    async (
      completed: boolean,
      silent = false,
      nextData: InvestigationData = formData,
    ) => {
      if (!consultationId || isPending) return false;

      const payload = {
        ...nextData,
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
          ["consultation-investigation", consultationId],
          response,
        );

        if (!silent) {
          toast.success(
            recordId
              ? "Investigation results updated successfully"
              : "Investigation results saved successfully",
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
              : "Failed to save investigation results",
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
      formData,
      isPending,
      onSave,
      onSaveAndContinue,
      queryClient,
      recordId,
      updateMutation,
    ],
  );

  const { autosaveState } = useDebouncedAutosave({
    value: formData,
    enabled: isEditable && !!consultationId,
    isSaving: isPending,
    onSave: async (nextData) => {
      const hasContent = Object.values(nextData).some(
        (value) => String(value ?? "").trim() !== "",
      );

      if (!hasContent && !recordId) return false;

      return handleSaveSubmit(false, true, nextData);
    },
  });

  // Investigation fields are read-only in both locked and addendum modes
  const fieldsDisabled = isLoading || isLocked || isAddendumOnly;
  const loadingFieldClass = isLoading
    ? "animate-pulse !border-[#B8C3F5] !bg-[#EEF2FF] text-transparent placeholder:text-transparent"
    : "";

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 space-y-5 shadow-sm border border-[#E5E7EB]">
      {isEditable && (
        <div className="flex justify-end">
          <AutosaveIndicator state={autosaveState} />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label className="block text-[#374151] mb-2">Blood Test</Label>
          <Textarea
            name="blood_test"
            value={formData.blood_test}
            onChange={handleChange}
            className={`min-h-[140px] font-mono !text-xs ${loadingFieldClass}`}
            placeholder={`Complete Blood Count:\nHb: 12.5 g/dL (normal)\nWBC: 7.2 x10^9/L (normal)...`}
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">Microbiology</Label>
          <Textarea
            name="microbiology"
            value={formData.microbiology}
            onChange={handleChange}
            className={`min-h-[140px] !text-xs ${loadingFieldClass}`}
            placeholder="Enter microbiology results..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">Radiology</Label>
          <Textarea
            name="radiology"
            value={formData.radiology}
            onChange={handleChange}
            className={`min-h-[140px] !text-xs ${loadingFieldClass}`}
            placeholder={`Chest X-ray (AP view):\n- Normal heart size and shape...`}
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">Cardiovascular</Label>
          <Textarea
            name="cardiovascular"
            value={formData.cardiovascular}
            onChange={handleChange}
            className={`min-h-[140px] !text-xs ${loadingFieldClass}`}
            placeholder={`ECG:\n- Sinus rhythm...`}
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">Procedures</Label>
          <Textarea
            name="procedures"
            value={formData.procedures}
            onChange={handleChange}
            className={`min-h-[140px] !text-xs ${loadingFieldClass}`}
            placeholder="Enter procedure results..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">Others</Label>
          <Textarea
            name="others"
            value={formData.others}
            onChange={handleChange}
            className={`min-h-[140px] !text-xs ${loadingFieldClass}`}
            placeholder="Any additional investigation results..."
            disabled={fieldsDisabled}
          />
        </div>
      </div>

      {/* Addendum section: only shown when the assigned doctor arrives
          via the patient route. Investigation fields remain locked. */}
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

      {/* Action buttons: hidden when fully locked.
          In addendum mode, only "Save Addendum" is shown — no Save and Continue
          since the consultation is already completed. */}
      {!isLocked && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#E5E7EB]">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-6 py-2.5 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg hover:bg-[#F9FAFB] transition-colors text-xs disabled:opacity-50"
          >
            Cancel
          </button>
          {isAddendumOnly && (
            <button
              onClick={() => void handleSaveSubmit(false)}
              disabled={isPending}
              className="px-6 py-2.5 bg-[#F3F4F6] text-[#374151] rounded-lg hover:bg-[#E5E7EB] transition-colors border border-[#D1D5DB] text-xs disabled:opacity-50 flex items-center gap-2"
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
              className="px-6 py-2.5 bg-[#5164E8] text-white rounded-lg hover:bg-[#4153D6] transition-colors shadow-sm text-xs disabled:opacity-50 flex items-center gap-2"
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
