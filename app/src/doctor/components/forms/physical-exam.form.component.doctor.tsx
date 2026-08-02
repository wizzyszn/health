import { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createPhysicalExamForConsultationReq,
  updatePhysicalExamForConsultationReq,
  getPhysicalExamForConsultationReq,
} from "@/config/service/doctor.service";
import { Loader2 } from "lucide-react";
import { ConsultationMode } from "../../pages/view-consultation-space.page.doctor";
import { useDebouncedAutosave } from "@/shared/hooks/use-debounced-autosave";
import AutosaveIndicator from "@/shared/components/autosave-indicator.component";

interface PhysicalExamFormProps {
  consultationId?: string;
  mode?: ConsultationMode;
  onCancel: () => void;
  onSave: () => void;
  onSaveAndContinue: () => void;
}

type PhysicalExamData = {
  _id?: string;
  general_physical: string;
  nervous_system: string;
  respiratory_system: string;
  cardiovascular_system: string;
  gastrointestinal_system: string;
  genitourinary_system: string;
  musculoskeletal_system: string;
  ENT: string;
  obstetric_gynaecological: string;
  others: string;
};

// ── Outer shell: fetches existing data, shows spinner, then renders inner ──
export function PhysicalExamForm({
  consultationId,
  mode = "edit",
  onCancel,
  onSave,
  onSaveAndContinue,
}: PhysicalExamFormProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["consultation-physical", consultationId],
    queryFn: () => getPhysicalExamForConsultationReq(consultationId!),
    enabled: !!consultationId,
    retry: false,
  });

  return (
    <PhysicalExamInner
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
function PhysicalExamInner({
  consultationId,
  existingData,
  isLoading,
  mode,
  onCancel,
  onSave,
  onSaveAndContinue,
}: {
  consultationId?: string;
  existingData?: Partial<PhysicalExamData>;
  isLoading: boolean;
  mode: ConsultationMode;
  onCancel: () => void;
  onSave: () => void;
  onSaveAndContinue: () => void;
}) {
  // Derive intent from mode — single source of truth
  const isLocked = mode === "locked"; // entire form non-interactive
  const isAddendumOnly = mode === "addendum"; // all fields locked, no actions
  const isEditable = mode === "edit"; // full edit access

  const draftKey = `draft-consultation-${consultationId}-physical`;

  const [formData, setFormData] = useState<PhysicalExamData>(() => {
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
      general_physical: existingData?.general_physical ?? "",
      nervous_system: existingData?.nervous_system ?? "",
      respiratory_system: existingData?.respiratory_system ?? "",
      cardiovascular_system: existingData?.cardiovascular_system ?? "",
      gastrointestinal_system: existingData?.gastrointestinal_system ?? "",
      genitourinary_system: existingData?.genitourinary_system ?? "",
      musculoskeletal_system: existingData?.musculoskeletal_system ?? "",
      ENT: existingData?.ENT ?? "",
      obstetric_gynaecological: existingData?.obstetric_gynaecological ?? "",
      others: existingData?.others ?? "",
    };
  });

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
      general_physical: existingData?.general_physical ?? "",
      nervous_system: existingData?.nervous_system ?? "",
      respiratory_system: existingData?.respiratory_system ?? "",
      cardiovascular_system: existingData?.cardiovascular_system ?? "",
      gastrointestinal_system: existingData?.gastrointestinal_system ?? "",
      genitourinary_system: existingData?.genitourinary_system ?? "",
      musculoskeletal_system: existingData?.musculoskeletal_system ?? "",
      ENT: existingData?.ENT ?? "",
      obstetric_gynaecological: existingData?.obstetric_gynaecological ?? "",
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
      data: PhysicalExamData & { status: "COMPLETED" | "INCOMPLETE" },
    ) => createPhysicalExamForConsultationReq(data, consultationId!),
  });

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: (
      data: Partial<PhysicalExamData> & { status: "COMPLETED" | "INCOMPLETE" },
    ) => updatePhysicalExamForConsultationReq(data, recordId!),
  });

  const isPending = isLoading || isCreating || isUpdating;

  const handleSaveSubmit = useCallback(
    async (
      completed: boolean,
      silent = false,
      nextData: PhysicalExamData = formData,
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
          ["consultation-physical", consultationId],
          response,
        );

        if (!silent) {
          toast.success(
            recordId
              ? "Physical exam updated successfully"
              : "Physical exam saved successfully",
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
              : "Failed to save physical exam",
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

  // Physical exam fields are read-only in both locked and addendum modes —
  // this section is never the addendum target, so both collapse to disabled.
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
          <Label className="block text-[#374151] mb-2">General Physical</Label>
          <Textarea
            name="general_physical"
            value={formData.general_physical}
            onChange={handleChange}
            className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
            placeholder="Patient alert and oriented..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">Nervous System</Label>
          <Textarea
            name="nervous_system"
            value={formData.nervous_system}
            onChange={handleChange}
            className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
            placeholder="Conscious and alert..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">
            Respiratory System
          </Label>
          <Textarea
            name="respiratory_system"
            value={formData.respiratory_system}
            onChange={handleChange}
            className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
            placeholder="Chest clear..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">
            Cardiovascular System
          </Label>
          <Textarea
            name="cardiovascular_system"
            value={formData.cardiovascular_system}
            onChange={handleChange}
            className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
            placeholder="Heart sounds S1 S2 normal..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">
            Gastro-intestinal System
          </Label>
          <Textarea
            name="gastrointestinal_system"
            value={formData.gastrointestinal_system}
            onChange={handleChange}
            className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
            placeholder="Abdomen soft..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">
            Genito-urinary System
          </Label>
          <Textarea
            name="genitourinary_system"
            value={formData.genitourinary_system}
            onChange={handleChange}
            className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
            placeholder="Enter examination findings..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">
            Musculo-skeletal System
          </Label>
          <Textarea
            name="musculoskeletal_system"
            value={formData.musculoskeletal_system}
            onChange={handleChange}
            className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
            placeholder="Full range of movement..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">ENT</Label>
          <Textarea
            name="ENT"
            value={formData.ENT}
            onChange={handleChange}
            className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
            placeholder="Enter examination findings..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">
            Obstetric / Gynaecological
          </Label>
          <Textarea
            name="obstetric_gynaecological"
            value={formData.obstetric_gynaecological}
            onChange={handleChange}
            className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
            placeholder="Enter examination findings..."
            disabled={fieldsDisabled}
          />
        </div>

        <div>
          <Label className="block text-[#374151] mb-2">Others</Label>
          <Textarea
            name="others"
            value={formData.others}
            onChange={handleChange}
            className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
            placeholder="Any additional examination findings..."
            disabled={fieldsDisabled}
          />
        </div>
      </div>

      {/* Action buttons: hidden in both locked and addendum modes.
          Physical exam is never the addendum target, so neither mode
          should expose save actions here. */}
      {isEditable && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#E5E7EB]">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-6 py-2.5 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg hover:bg-[#F9FAFB] transition-colors text-xs disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSaveSubmit(true)}
            disabled={isPending || isContinuePending}
            className="px-6 py-2.5 bg-[#5164E8] text-white rounded-lg hover:bg-[#4153D6] transition-colors shadow-sm text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isContinuePending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save and Continue
          </button>
        </div>
      )}
    </div>
  );
}
