import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createHistoryTakingForConsultationReq,
  updateHistoryTakingForConsultationReq,
  getHistoryTakingForConsultationReq,
} from "@/config/service/doctor.service";
import { Loader2 } from "lucide-react";
import { ConsultationMode } from "../../pages/view-consultation-space.page.doctor";
import { useDebouncedAutosave } from "@/shared/hooks/use-debounced-autosave";
import AutosaveIndicator from "@/shared/components/autosave-indicator.component";

interface HistoryTakingFormProps {
  consultationId?: string;
  mode?: ConsultationMode;
  onCancel: () => void;
  onSave: () => void;
  onSaveAndContinue: () => void;
}

type HistoryTakingData = {
  _id?: string;
  present_complaint: string;
  history_of_presenting_complaint: string;
  past_medical_surgical_history: string;
  medication_history: string;
  allergy_history: string[];
  family_history: string;
  travel_history: string;
  occupation: string;
  social_history: string;
  obstetric_gynaecological_history: string;
  others: string;
};

// ── Outer shell: fetches existing data, shows spinner, then renders inner ──
export function HistoryTakingForm({
  consultationId,
  mode = "edit",
  onCancel,
  onSave,
  onSaveAndContinue,
}: HistoryTakingFormProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["consultation-history", consultationId],
    queryFn: () => getHistoryTakingForConsultationReq(consultationId!),
    enabled: !!consultationId,
    retry: false,
  });

  return (
    <HistoryTakingInner
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
function HistoryTakingInner({
  consultationId,
  existingData,
  isLoading,
  mode,
  onCancel,
  onSave,
  onSaveAndContinue,
}: {
  consultationId?: string;
  existingData?: Partial<HistoryTakingData>;
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

  const draftKey = `draft-consultation-${consultationId}-history`;

  const [formData, setFormData] = useState<HistoryTakingData>(() => {
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
      present_complaint: existingData?.present_complaint ?? "",
      history_of_presenting_complaint:
        existingData?.history_of_presenting_complaint ?? "",
      past_medical_surgical_history:
        existingData?.past_medical_surgical_history ?? "",
      medication_history: existingData?.medication_history ?? "",
      allergy_history: existingData?.allergy_history ?? [],
      family_history: existingData?.family_history ?? "",
      travel_history: existingData?.travel_history ?? "",
      occupation: existingData?.occupation ?? "",
      social_history: existingData?.social_history ?? "",
      obstetric_gynaecological_history:
        existingData?.obstetric_gynaecological_history ?? "",
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
      present_complaint: existingData?.present_complaint ?? "",
      history_of_presenting_complaint:
        existingData?.history_of_presenting_complaint ?? "",
      past_medical_surgical_history:
        existingData?.past_medical_surgical_history ?? "",
      medication_history: existingData?.medication_history ?? "",
      allergy_history: existingData?.allergy_history ?? [],
      family_history: existingData?.family_history ?? "",
      travel_history: existingData?.travel_history ?? "",
      occupation: existingData?.occupation ?? "",
      social_history: existingData?.social_history ?? "",
      obstetric_gynaecological_history:
        existingData?.obstetric_gynaecological_history ?? "",
      others: existingData?.others ?? "",
    });
    setRecordId(existingData?._id);
    hydratedConsultationRef.current = hydrationKey;
  }, [consultationId, draftKey, existingData, isEditable, isLoading]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!isEditable) return;
    setFormData((prev) => {
      const updated = { ...prev, [e.target.name]: e.target.value };
      localStorage.setItem(draftKey, JSON.stringify(updated));
      return updated;
    });
  };

  // allergy_history is a string[] so it needs its own handler.
  // Guarded by isEditable for consistency with handleChange.
  const handleAllergyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isEditable) return;
    const updated = {
      ...formData,
      allergy_history: e.target.value.split(",").map((v) => v.trim()),
    };
    setFormData(updated);
    localStorage.setItem(draftKey, JSON.stringify(updated));
  };

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation({
    mutationFn: (
      data: HistoryTakingData & { status: "COMPLETED" | "INCOMPLETE" },
    ) => createHistoryTakingForConsultationReq(data, consultationId!),
  });

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: (
      data: Partial<HistoryTakingData> & { status: "COMPLETED" | "INCOMPLETE" },
    ) => updateHistoryTakingForConsultationReq(data, recordId!),
  });

  const isPending = isLoading || isCreating || isUpdating;

  const handleSaveSubmit = useCallback(
    async (
      completed: boolean,
      silent = false,
      nextData: HistoryTakingData = formData,
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
          ["consultation-history", consultationId],
          response,
        );

        if (!silent) {
          toast.success(
            recordId
              ? "History taking updated successfully"
              : "History taking saved successfully",
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
              : "Failed to save history taking",
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
      const hasContent = Object.values(nextData).some((value) =>
        Array.isArray(value)
          ? value.some((item) => item.trim() !== "")
          : String(value ?? "").trim() !== "",
      );

      if (!hasContent && !recordId) return false;

      return handleSaveSubmit(false, true, nextData);
    },
  });

  // All history fields are read-only in both locked and addendum modes
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
      <div className="space-y-5">
        <div>
          <Label className="block text-[#374151] mb-2">Present Complaint</Label>
          <Textarea
            name="present_complaint"
            value={formData.present_complaint}
            onChange={handleChange}
            className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
            placeholder="E.g., Recurrent headache for 3 weeks..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">
            History of Presenting Complaint (Hx of PC)
          </Label>
          <Textarea
            name="history_of_presenting_complaint"
            value={formData.history_of_presenting_complaint}
            onChange={handleChange}
            className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
            placeholder="Patient reports that headaches started..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">
            Past Medical History / Past Surgical History (PMHx / PSHx)
          </Label>
          <Textarea
            name="past_medical_surgical_history"
            value={formData.past_medical_surgical_history}
            onChange={handleChange}
            className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
            placeholder="E.g., Type 2 Diabetes Mellitus diagnosed 2015..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">
            Medication History
          </Label>
          <Textarea
            name="medication_history"
            value={formData.medication_history}
            onChange={handleChange}
            className={`min-h-[80px] !text-xs ${loadingFieldClass}`}
            placeholder="Current medications..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">Allergy History</Label>
          {/* allergy_history is string[] — uses its own handler to split on comma.
              value is joined for display; onChange re-splits into the array. */}
          <Textarea
            name="allergy_history"
            value={formData.allergy_history.join(", ")}
            onChange={handleAllergyChange}
            className={`min-h-[60px] !text-xs ${loadingFieldClass}`}
            placeholder="Comma separated allergies e.g. Penicillin, Peanuts"
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">Family History</Label>
          <Textarea
            name="family_history"
            value={formData.family_history}
            onChange={handleChange}
            className={`min-h-[80px] !text-xs ${loadingFieldClass}`}
            placeholder="Father had hypertension..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">Travel History</Label>
          <Textarea
            name="travel_history"
            value={formData.travel_history}
            onChange={handleChange}
            className={`min-h-[60px] !text-xs ${loadingFieldClass}`}
            placeholder="Recent travel history..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">Occupation</Label>
          {/* HEAD had an uncontrolled <Input> with no name/value — fixed to
              controlled, consistent with every other field in this form. */}
          <Input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            className={`!text-xs ${loadingFieldClass}`}
            placeholder="Software Engineer"
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">Social History</Label>
          <Textarea
            name="social_history"
            value={formData.social_history}
            onChange={handleChange}
            className={`min-h-[80px] !text-xs ${loadingFieldClass}`}
            placeholder="Smoking, alcohol, living situation..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">
            Obstetric / Gynaecological History
          </Label>
          <Textarea
            name="obstetric_gynaecological_history"
            value={formData.obstetric_gynaecological_history}
            onChange={handleChange}
            className={`min-h-[60px] !text-xs ${loadingFieldClass}`}
            placeholder="G2P2, LMP..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">Others</Label>
          <Textarea
            name="others"
            value={formData.others}
            onChange={handleChange}
            className={`min-h-[60px] !text-xs ${loadingFieldClass}`}
            placeholder="Any additional relevant information..."
            disabled={fieldsDisabled}
          />
        </div>
      </div>

      {/* Addendum section: only shown when the assigned doctor arrives
          via the patient route. All history fields remain locked. */}
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
            className="px-6 py-2.5 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg hover:bg-[#F9FAFB] transition-colors text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          {isAddendumOnly && (
            <button
              onClick={() => void handleSaveSubmit(false)}
              disabled={isPending}
              className="px-6 py-2.5 bg-[#F3F4F6] text-[#374151] rounded-lg hover:bg-[#E5E7EB] transition-colors border border-[#D1D5DB] text-sm disabled:opacity-50 flex items-center gap-2"
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
              className="px-6 py-2.5 bg-[#5164E8] text-white rounded-lg hover:bg-[#4153D6] transition-colors shadow-sm text-sm disabled:opacity-50 flex items-center gap-2"
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
