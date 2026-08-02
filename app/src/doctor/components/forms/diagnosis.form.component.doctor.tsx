import { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createDiagnosisForConsultationReq,
  updateDiagnosisForConsultationReq,
  getDiagnosisForConsultationReq,
} from "@/config/service/doctor.service";
import { Loader2, X } from "lucide-react";
import { ConsultationMode } from "../../pages/view-consultation-space.page.doctor";
import { useDebouncedAutosave } from "@/shared/hooks/use-debounced-autosave";
import AutosaveIndicator from "@/shared/components/autosave-indicator.component";

interface DiagnosisFormProps {
  consultationId?: string;
  mode?: ConsultationMode;
  onCancel: () => void;
  onSave: () => void;
  onSaveAndContinue: () => void;
}

type DiagnosisData = {
  _id?: string;
  provisional_diagnosis: string[];
  final_diagnosis: string[];
};

// ── Outer shell: fetches existing data, shows spinner, then renders inner ──
export function DiagnosisForm({
  consultationId,
  mode = "edit",
  onCancel,
  onSave,
  onSaveAndContinue,
}: DiagnosisFormProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["consultation-diagnosis", consultationId],
    queryFn: () => getDiagnosisForConsultationReq(consultationId!),
    enabled: !!consultationId,
    retry: false,
  });

  return (
    <DiagnosisInner
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
function DiagnosisInner({
  consultationId,
  existingData,
  isLoading,
  mode,
  onCancel,
  onSave,
  onSaveAndContinue,
}: {
  consultationId?: string;
  existingData?: Partial<DiagnosisData>;
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

  const draftKey = `draft-consultation-${consultationId}-diagnosis`;

  // Draft is read once inside lazy initialisers — not at render time —
  // to avoid the side-effect-during-render bug in the original other branch.
  const readDraft = useCallback((): Partial<{
    provisionalPills: string[];
    provisionalSearch: string;
    provisionalText: string;
    finalPills: string[];
    finalSearch: string;
    finalText: string;
  }> | null => {
    if (!isEditable) return null;
    const saved = localStorage.getItem(draftKey);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse draft from localStorage", e);
      return null;
    }
  }, [draftKey, isEditable]);

  const [provisionalPills, setProvisionalPills] = useState<string[]>(() => {
    const d = readDraft();
    const stored =
      d?.provisionalPills ??
      d?.provisionalSearch ??
      existingData?.provisional_diagnosis?.[0] ??
      "";
    return Array.isArray(stored)
      ? stored
      : stored
        ? stored
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];
  });
  const [provisionalInputValue, setProvisionalInputValue] = useState("");
  const [provisionalText, setProvisionalText] = useState<string>(() => {
    const d = readDraft();
    return d?.provisionalText ?? existingData?.provisional_diagnosis?.[1] ?? "";
  });

  const [finalPills, setFinalPills] = useState<string[]>(() => {
    const d = readDraft();
    const stored =
      d?.finalPills ??
      d?.finalSearch ??
      existingData?.final_diagnosis?.[0] ??
      "";
    return Array.isArray(stored)
      ? stored
      : stored
        ? stored
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];
  });
  const [finalInputValue, setFinalInputValue] = useState("");
  const [finalText, setFinalText] = useState<string>(() => {
    const d = readDraft();
    return d?.finalText ?? existingData?.final_diagnosis?.[1] ?? "";
  });

  const [addendumText, setAddendumText] = useState("");
  const [recordId, setRecordId] = useState(existingData?._id);
  const [isContinuePending, setIsContinuePending] = useState(false);
  const [showProvisionalDropdown, setShowProvisionalDropdown] = useState(false);
  const [showFinalDropdown, setShowFinalDropdown] = useState(false);

  const queryClient = useQueryClient();

  const provisionalContainerRef = useRef<HTMLDivElement>(null);
  const finalContainerRef = useRef<HTMLDivElement>(null);
  const hydratedConsultationRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const hydrationKey = consultationId ?? "new";
    if (isLoading || hydratedConsultationRef.current === hydrationKey) return;

    const d = readDraft();
    const nextProvisional =
      d?.provisionalPills ??
      d?.provisionalSearch ??
      existingData?.provisional_diagnosis?.[0] ??
      "";
    const nextFinal =
      d?.finalPills ??
      d?.finalSearch ??
      existingData?.final_diagnosis?.[0] ??
      "";

    setProvisionalPills(
      Array.isArray(nextProvisional)
        ? nextProvisional
        : nextProvisional
          ? nextProvisional
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
    );
    setProvisionalText(
      d?.provisionalText ?? existingData?.provisional_diagnosis?.[1] ?? "",
    );
    setFinalPills(
      Array.isArray(nextFinal)
        ? nextFinal
        : nextFinal
          ? nextFinal
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
    );
    setFinalText(d?.finalText ?? existingData?.final_diagnosis?.[1] ?? "");
    setRecordId(existingData?._id);
    hydratedConsultationRef.current = hydrationKey;
  }, [consultationId, existingData, isLoading, readDraft]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        provisionalContainerRef.current &&
        !provisionalContainerRef.current.contains(e.target as Node)
      ) {
        setShowProvisionalDropdown(false);
      }
      if (
        finalContainerRef.current &&
        !finalContainerRef.current.contains(e.target as Node)
      ) {
        setShowFinalDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Writes all four fields to localStorage atomically
  const updateDraft = (
    patch: Partial<{
      provisionalPills: string[];
      provisionalText: string;
      finalPills: string[];
      finalText: string;
    }>,
  ) => {
    const next = {
      provisionalPills,
      provisionalText,
      finalPills,
      finalText,
      ...patch,
    };
    localStorage.setItem(draftKey, JSON.stringify(next));
  };

  const icd10Suggestions = [
    { code: "G43.0", name: "Migraine without aura" },
    { code: "G43.1", name: "Migraine with aura" },
    { code: "G44.0", name: "Cluster headache syndrome" },
    { code: "G44.2", name: "Tension-type headache" },
    { code: "R51", name: "Headache" },
    { code: "I10", name: "Essential (primary) hypertension" },
    { code: "E11", name: "Type 2 diabetes mellitus" },
    { code: "J06.9", name: "Acute upper respiratory infection" },
    { code: "R50.9", name: "Fever, unspecified" },
  ];

  const filteredProvisional = icd10Suggestions.filter((item) => {
    const codeString = `${item.code} - ${item.name}`;
    if (provisionalPills.includes(codeString)) return false;
    if (!provisionalInputValue) return true;
    return (
      item.code.toLowerCase().includes(provisionalInputValue.toLowerCase()) ||
      item.name.toLowerCase().includes(provisionalInputValue.toLowerCase())
    );
  });

  const filteredFinal = icd10Suggestions.filter((item) => {
    const codeString = `${item.code} - ${item.name}`;
    if (finalPills.includes(codeString)) return false;
    if (!finalInputValue) return true;
    return (
      item.code.toLowerCase().includes(finalInputValue.toLowerCase()) ||
      item.name.toLowerCase().includes(finalInputValue.toLowerCase())
    );
  });

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation({
    mutationFn: (
      data: DiagnosisData & { status: "COMPLETED" | "INCOMPLETE" },
    ) => createDiagnosisForConsultationReq(consultationId!, data),
  });

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: (
      data: DiagnosisData & { status: "COMPLETED" | "INCOMPLETE" },
    ) => updateDiagnosisForConsultationReq(recordId || consultationId!, data),
  });

  const isPending = isLoading || isCreating || isUpdating;

  const handleSaveSubmit = useCallback(
    async (
      completed: boolean,
      silent = false,
      nextData = {
        provisionalPills,
        provisionalText,
        finalPills,
        finalText,
      },
    ) => {
      if (!consultationId || isPending) return false;

      const payload = {
        provisional_diagnosis: [
          nextData.provisionalPills.join(", "),
          nextData.provisionalText,
        ],
        final_diagnosis: [nextData.finalPills.join(", "), nextData.finalText],
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
          ["consultation-diagnosis", consultationId],
          response,
        );

        if (!silent) {
          toast.success(
            recordId
              ? "Diagnosis updated successfully"
              : "Diagnosis saved successfully",
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
            error instanceof Error ? error.message : "Failed to save diagnosis",
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
      finalPills,
      finalText,
      isPending,
      onSave,
      onSaveAndContinue,
      provisionalPills,
      provisionalText,
      queryClient,
      recordId,
      updateMutation,
    ],
  );

  const { autosaveState } = useDebouncedAutosave({
    value: {
      provisionalPills,
      provisionalText,
      finalPills,
      finalText,
    },
    enabled: isEditable && !!consultationId,
    isSaving: isPending,
    onSave: async (nextData) => {
      const hasContent =
        nextData.provisionalPills.length > 0 ||
        nextData.finalPills.length > 0 ||
        nextData.provisionalText.trim() !== "" ||
        nextData.finalText.trim() !== "";

      if (!hasContent && !recordId) return false;

      return handleSaveSubmit(false, true, nextData);
    },
  });

  // Diagnosis fields are read-only in both locked and addendum modes
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Provisional Diagnosis ── */}
        <div>
          <h3 className="text-sm text-[#1F2937] mb-4">Provisional Diagnosis</h3>
          <div className="space-y-3">
            <div className="relative" ref={provisionalContainerRef}>
              <Label className="block text-[#374151] mb-2 text-xs">
                Search ICD-10
              </Label>

              <div
                className={`flex flex-wrap items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-md border border-[#D1D5DB] bg-white transition-colors focus-within:ring-2 focus-within:ring-[#5164E8]/50 focus-within:border-[#5164E8] cursor-text shadow-sm ${fieldsDisabled ? "bg-[#F3F4F6] opacity-60 cursor-not-allowed" : ""} ${isLoading ? "animate-pulse" : ""}`}
                onClick={() => {
                  if (!fieldsDisabled) {
                    document.getElementById("provisional-input")?.focus();
                    setShowProvisionalDropdown(true);
                  }
                }}
              >
                {isLoading ? (
                  <span className="h-4 w-40 rounded-md bg-[#C7D2FE]" />
                ) : (
                  <>
                    {provisionalPills.map((pill) => (
                      <span
                        key={pill}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#5164E8]/10 text-[#5164E8] border border-[#5164E8]/20"
                      >
                        {pill}
                        {!fieldsDisabled && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = provisionalPills.filter(
                                (p) => p !== pill,
                              );
                              setProvisionalPills(next);
                              updateDraft({ provisionalPills: next });
                            }}
                            className="inline-flex items-center justify-center rounded-full size-4 hover:bg-[#5164E8]/20 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </span>
                    ))}
                    <input
                      id="provisional-input"
                      type="text"
                      className="flex-1 min-w-[120px] text-xs bg-transparent outline-none placeholder:text-[#9CA3AF]"
                      placeholder={
                        provisionalPills.length === 0
                          ? "Type to search ICD-10 codes..."
                          : ""
                      }
                      value={provisionalInputValue}
                      disabled={fieldsDisabled}
                      onChange={(e) => {
                        if (!isEditable) return;
                        setProvisionalInputValue(e.target.value);
                        setShowProvisionalDropdown(true);
                      }}
                      onFocus={() => {
                        if (!fieldsDisabled) setShowProvisionalDropdown(true);
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          provisionalInputValue === "" &&
                          provisionalPills.length > 0
                        ) {
                          e.preventDefault();
                          const next = provisionalPills.slice(0, -1);
                          setProvisionalPills(next);
                          updateDraft({ provisionalPills: next });
                        }
                      }}
                    />
                  </>
                )}
              </div>

              {/* Dropdown gated on !fieldsDisabled — unified between branches */}
              {!fieldsDisabled &&
                showProvisionalDropdown &&
                filteredProvisional.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#D1D5DB] rounded-lg shadow-lg max-h-[240px] overflow-y-auto">
                    {filteredProvisional.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 hover:bg-[#F9FAFB] cursor-pointer border-b border-[#E5E7EB] last:border-b-0"
                        onClick={() => {
                          const codeString = `${item.code} - ${item.name}`;
                          const next = [...provisionalPills, codeString];
                          setProvisionalPills(next);
                          setProvisionalInputValue("");
                          setShowProvisionalDropdown(false);
                          updateDraft({ provisionalPills: next });
                        }}
                      >
                        <div className="text-[#5164E8] text-sm font-medium">
                          {item.code}
                        </div>
                        <div className="text-[#374151] text-xs mt-0.5">
                          {item.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div>
              <Label className="block text-[#374151] mb-2 text-xs">
                Free Text Diagnosis
              </Label>
              {/* defaultValue removed — value + defaultValue on the same
                  controlled textarea causes a React warning and is ignored. */}
              <Textarea
                value={provisionalText}
                onChange={(e) => {
                  if (!isEditable) return;
                  setProvisionalText(e.target.value);
                  updateDraft({ provisionalText: e.target.value });
                }}
                className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
                placeholder="Enter provisional diagnosis details..."
                disabled={fieldsDisabled}
              />
            </div>
          </div>
        </div>

        {/* ── Final Diagnosis ── */}
        <div>
          <h3 className="text-sm text-[#1F2937] mb-4">Final Diagnosis</h3>
          <div className="space-y-3">
            <div className="relative" ref={finalContainerRef}>
              <Label className="block text-[#374151] mb-2 text-xs">
                Search ICD-10
              </Label>

              <div
                className={`flex flex-wrap items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-md border border-[#D1D5DB] bg-white transition-colors focus-within:ring-2 focus-within:ring-[#5164E8]/50 focus-within:border-[#5164E8] cursor-text shadow-sm ${fieldsDisabled ? "bg-[#F3F4F6] opacity-60 cursor-not-allowed" : ""} ${isLoading ? "animate-pulse" : ""}`}
                onClick={() => {
                  if (!fieldsDisabled) {
                    document.getElementById("final-input")?.focus();
                    setShowFinalDropdown(true);
                  }
                }}
              >
                {isLoading ? (
                  <span className="h-4 w-40 rounded-md bg-[#C7D2FE]" />
                ) : (
                  <>
                    {finalPills.map((pill) => (
                      <span
                        key={pill}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#5164E8]/10 text-[#5164E8] border border-[#5164E8]/20"
                      >
                        {pill}
                        {!fieldsDisabled && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = finalPills.filter((p) => p !== pill);
                              setFinalPills(next);
                              updateDraft({ finalPills: next });
                            }}
                            className="inline-flex items-center justify-center rounded-full size-4 hover:bg-[#5164E8]/20 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </span>
                    ))}
                    <input
                      id="final-input"
                      type="text"
                      className="flex-1 min-w-[120px] text-xs bg-transparent outline-none placeholder:text-[#9CA3AF]"
                      placeholder={
                        finalPills.length === 0
                          ? "Type to search ICD-10 codes..."
                          : ""
                      }
                      value={finalInputValue}
                      disabled={fieldsDisabled}
                      onChange={(e) => {
                        if (!isEditable) return;
                        setFinalInputValue(e.target.value);
                        setShowFinalDropdown(true);
                      }}
                      onFocus={() => {
                        if (!fieldsDisabled) setShowFinalDropdown(true);
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          finalInputValue === "" &&
                          finalPills.length > 0
                        ) {
                          e.preventDefault();
                          const next = finalPills.slice(0, -1);
                          setFinalPills(next);
                          updateDraft({ finalPills: next });
                        }
                      }}
                    />
                  </>
                )}
              </div>

              {!fieldsDisabled &&
                showFinalDropdown &&
                filteredFinal.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#D1D5DB] rounded-lg shadow-lg max-h-[240px] overflow-y-auto">
                    {filteredFinal.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 hover:bg-[#F9FAFB] cursor-pointer border-b border-[#E5E7EB] last:border-b-0"
                        onClick={() => {
                          const codeString = `${item.code} - ${item.name}`;
                          const next = [...finalPills, codeString];
                          setFinalPills(next);
                          setFinalInputValue("");
                          setShowFinalDropdown(false);
                          updateDraft({ finalPills: next });
                        }}
                      >
                        <div className="text-[#5164E8] text-sm font-medium">
                          {item.code}
                        </div>
                        <div className="text-[#374151] text-xs mt-0.5">
                          {item.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div>
              <Label className="block text-[#374151] mb-2 !text-xs">
                Free Text Diagnosis
              </Label>
              <Textarea
                value={finalText}
                onChange={(e) => {
                  if (!isEditable) return;
                  setFinalText(e.target.value);
                  updateDraft({ finalText: e.target.value });
                }}
                className={`min-h-[100px] !text-xs ${loadingFieldClass}`}
                placeholder="Enter final diagnosis details..."
                disabled={fieldsDisabled}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Addendum section: only shown when the assigned doctor arrives
          via the patient route. All diagnosis fields remain locked. */}
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
          In addendum mode, only "Save Addendum" shown — no Save and Continue. */}
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
