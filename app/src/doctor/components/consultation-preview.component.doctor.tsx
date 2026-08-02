import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getHistoryTakingForConsultationReq,
  getPhysicalExamForConsultationReq,
  getInvestigationForConsultationReq,
  getDiagnosisForConsultationReq,
  getTreatmentPlanForConsultationReq,
  updateHistoryTakingForConsultationReq,
  updatePhysicalExamForConsultationReq,
  updateInvestigationForConsultationReq,
  updateDiagnosisForConsultationReq,
  updateTreatmentPlanForConsultationReq,
  createHistoryTakingForConsultationReq,
  createPhysicalExamForConsultationReq,
  createInvestigationForConsultationReq,
  createDiagnosisForConsultationReq,
  createTreatmentPlanForConsultationReq,
} from "@/config/service/doctor.service";

// ─── Helper functions ────────────────────────────────────────────────────

/** Generate addendum separator with current timestamp */
function getAddendumSeparator(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `\n\n── Addendum, ${dateStr} ${timeStr} ──\n`;
}

// ─── Shared subcomponents ────────────────────────────────────────────────

/** Read-only field that shows original data in a greyed-out block */
function PreviewField({
  label,
  value,
}: {
  label: string;
  value?: string | string[];
}) {
  const display = Array.isArray(value)
    ? value.filter(Boolean).join(", ")
    : value;
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="text-xs font-medium text-[#4B5563] mb-1">{label}</h4>
      <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-md p-3 text-sm text-[#6B7280] whitespace-pre-wrap min-h-[42px]">
        {display || <span className="italic text-[#9CA3AF]">Not recorded</span>}
      </div>
    </div>
  );
}

/** Addendum field: shows original (greyed) + editable addendum textarea */
function AddendumField({
  label,
  originalValue,
  addendumValue,
  onChange,
}: {
  label: string;
  originalValue?: string;
  addendumValue: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <h4 className="text-xs font-medium text-[#4B5563] mb-1">{label}</h4>
      {/* Original — greyed out */}
      <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-md p-3 text-sm text-[#6B7280] whitespace-pre-wrap min-h-[42px] mb-2">
        {originalValue || (
          <span className="italic text-[#9CA3AF]">Not recorded</span>
        )}
      </div>
      {/* Addendum textarea */}
      <div className="pl-3 border-l-2 border-[#5164E8]">
        <span className="text-[10px] font-semibold text-[#5164E8] uppercase tracking-wider mb-1 block">
          Addendum
        </span>
        <Textarea
          value={addendumValue}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[80px] !text-xs bg-white"
          placeholder={`Add additional notes for ${label.toLowerCase()}…`}
        />
      </div>
    </div>
  );
}

/** Section card wrapper with blue left accent border */
function SectionCard({
  title,
  status,
  children,
  footer,
}: {
  title: string;
  status?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden mb-6 relative">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5164E8]" />

      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#E5E7EB] flex sm:items-center flex-col sm:flex-row items-start gap-2 sm:gap-3">
        <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
        {status === "COMPLETED" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#ECFDF5] text-[#10B981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            Completed
          </span>
        )}
      </div>

      <div className="p-4 sm:p-6">{children}</div>

      {footer && <div className="px-4 sm:px-6 pb-3 sm:pb-4">{footer}</div>}
    </div>
  );
}

// ─── Addendum section components (self-contained mutations) ──────────────

function HistoryAddendum({
  consultationId,
  data,
}: {
  consultationId: string;
  data: Record<string, string | string[]> & { _id?: string };
}) {
  const fields = [
    { key: "present_complaint", label: "Present Complaint" },
    {
      key: "history_of_presenting_complaint",
      label: "History of Presenting Complaint",
    },
    {
      key: "past_medical_surgical_history",
      label: "Past Medical & Surgical History",
    },
    { key: "medication_history", label: "Medication History" },
    { key: "family_history", label: "Family History" },
    { key: "travel_history", label: "Travel History" },
    { key: "occupation", label: "Occupation" },
    { key: "social_history", label: "Social History" },
    {
      key: "obstetric_gynaecological_history",
      label: "Obstetric / Gynaecological",
    },
    { key: "others", label: "Others" },
  ] as const;

  const [addendums, setAddendums] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: Record<string, string | string[]>) =>
      data._id
        ? updateHistoryTakingForConsultationReq(
            { ...payload, status: "COMPLETED" } as unknown as Parameters<
              typeof updateHistoryTakingForConsultationReq
            >[0],
            data._id,
          )
        : createHistoryTakingForConsultationReq(
            { ...payload, status: "COMPLETED" } as unknown as Parameters<
              typeof createHistoryTakingForConsultationReq
            >[0],
            consultationId,
          ),
    onSuccess: () => {
      toast.success("History addendum saved");
      setAddendums({});
      queryClient.invalidateQueries({
        queryKey: ["consultation-history", consultationId],
      });
    },
    onError: () => toast.error("Failed to save history addendum"),
  });

  const hasAddendum = Object.values(addendums).some((v) => v.trim());

  const handleSave = () => {
    const payload: Record<string, string | string[]> = {};
    for (const f of fields) {
      const original = (data[f.key] as string) ?? "";
      const addendum = addendums[f.key]?.trim();
      payload[f.key] = addendum
        ? original + getAddendumSeparator() + addendum
        : original;
    }
    // preserve allergy_history as-is
    payload.allergy_history = (data.allergy_history as string[]) ?? [];
    mutate(payload);
  };

  return (
    <SectionCard
      title="History Taking"
      status={data.status as string}
      footer={
        hasAddendum ? (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="bg-[#5164E8] hover:bg-[#4153D7] text-white text-xs"
          >
            {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Save Addendum
          </Button>
        ) : null
      }
    >
      <div className="space-y-1">
        {fields.map((f) => (
          <AddendumField
            key={f.key}
            label={f.label}
            originalValue={data[f.key] as string}
            addendumValue={addendums[f.key] ?? ""}
            onChange={(v) => setAddendums((prev) => ({ ...prev, [f.key]: v }))}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function PhysicalExamAddendum({
  consultationId,
  data,
}: {
  consultationId: string;
  data: Record<string, string> & { _id?: string };
}) {
  const fields = [
    { key: "general_physical", label: "General Physical" },
    { key: "nervous_system", label: "Nervous System" },
    { key: "respiratory_system", label: "Respiratory System" },
    { key: "cardiovascular_system", label: "Cardiovascular System" },
    { key: "gastrointestinal_system", label: "Gastrointestinal System" },
    { key: "genitourinary_system", label: "Genitourinary System" },
    { key: "musculoskeletal_system", label: "Musculoskeletal System" },
    { key: "ENT", label: "ENT" },
    { key: "obstetric_gynaecological", label: "Obstetric / Gynaecological" },
    { key: "others", label: "Others" },
  ] as const;

  const [addendums, setAddendums] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      data._id
        ? updatePhysicalExamForConsultationReq(
            { ...payload, status: "COMPLETED" } as unknown as Parameters<
              typeof updatePhysicalExamForConsultationReq
            >[0],
            data._id,
          )
        : createPhysicalExamForConsultationReq(
            { ...payload, status: "COMPLETED" } as unknown as Parameters<
              typeof createPhysicalExamForConsultationReq
            >[0],
            consultationId,
          ),
    onSuccess: () => {
      toast.success("Physical exam addendum saved");
      setAddendums({});
      queryClient.invalidateQueries({
        queryKey: ["consultation-physical", consultationId],
      });
    },
    onError: () => toast.error("Failed to save physical exam addendum"),
  });

  const hasAddendum = Object.values(addendums).some((v) => v.trim());

  const handleSave = () => {
    const payload: Record<string, string> = {};
    for (const f of fields) {
      const original = data[f.key] ?? "";
      const addendum = addendums[f.key]?.trim();
      payload[f.key] = addendum
        ? original + getAddendumSeparator() + addendum
        : original;
    }
    mutate(payload);
  };

  return (
    <SectionCard
      title="Physical Exam"
      status={data.status}
      footer={
        hasAddendum ? (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="bg-[#5164E8] hover:bg-[#4153D7] text-white text-xs"
          >
            {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Save Addendum
          </Button>
        ) : null
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-6">
        {fields.map((f) => (
          <AddendumField
            key={f.key}
            label={f.label}
            originalValue={data[f.key]}
            addendumValue={addendums[f.key] ?? ""}
            onChange={(v) => setAddendums((prev) => ({ ...prev, [f.key]: v }))}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function InvestigationAddendum({
  consultationId,
  data,
}: {
  consultationId: string;
  data: Record<string, string> & { _id?: string };
}) {
  const fields = [
    { key: "blood_test", label: "Blood Tests" },
    { key: "microbiology", label: "Microbiology" },
    { key: "radiology", label: "Radiology" },
    { key: "cardiovascular", label: "Cardiovascular" },
    { key: "procedures", label: "Procedures" },
    { key: "others", label: "Others" },
  ] as const;

  const [addendums, setAddendums] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      data._id
        ? updateInvestigationForConsultationReq(
            { ...payload, status: "COMPLETED" } as unknown as Parameters<
              typeof updateInvestigationForConsultationReq
            >[0],
            data._id,
          )
        : createInvestigationForConsultationReq(
            { ...payload, status: "COMPLETED" } as unknown as Parameters<
              typeof createInvestigationForConsultationReq
            >[0],
            consultationId,
          ),
    onSuccess: () => {
      toast.success("Investigation addendum saved");
      setAddendums({});
      queryClient.invalidateQueries({
        queryKey: ["consultation-investigation", consultationId],
      });
    },
    onError: () => toast.error("Failed to save investigation addendum"),
  });

  const hasAddendum = Object.values(addendums).some((v) => v.trim());

  const handleSave = () => {
    const payload: Record<string, string> = {};
    for (const f of fields) {
      const original = data[f.key] ?? "";
      const addendum = addendums[f.key]?.trim();
      payload[f.key] = addendum
        ? original + getAddendumSeparator() + addendum
        : original;
    }
    mutate(payload);
  };

  return (
    <SectionCard
      title="Investigation Results"
      status={data.status}
      footer={
        hasAddendum ? (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="bg-[#5164E8] hover:bg-[#4153D7] text-white text-xs"
          >
            {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Save Addendum
          </Button>
        ) : null
      }
    >
      <div className="space-y-1">
        {fields.map((f) => (
          <AddendumField
            key={f.key}
            label={f.label}
            originalValue={data[f.key]}
            addendumValue={addendums[f.key] ?? ""}
            onChange={(v) => setAddendums((prev) => ({ ...prev, [f.key]: v }))}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function DiagnosisAddendum({
  consultationId,
  data,
}: {
  consultationId: string;
  data: {
    _id?: string;
    provisional_diagnosis?: string[];
    final_diagnosis?: string[];
    status?: string;
  };
}) {
  const [provisionalAddendum, setProvisionalAddendum] = useState("");
  const [finalAddendum, setFinalAddendum] = useState("");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: {
      provisional_diagnosis: string[];
      final_diagnosis: string[];
      status: "COMPLETED" | "INCOMPLETE";
    }) =>
      data._id
        ? updateDiagnosisForConsultationReq(consultationId, payload)
        : createDiagnosisForConsultationReq(consultationId, payload),
    onSuccess: () => {
      toast.success("Diagnosis addendum saved");
      setProvisionalAddendum("");
      setFinalAddendum("");
      queryClient.invalidateQueries({
        queryKey: ["consultation-diagnosis", consultationId],
      });
    },
    onError: () => toast.error("Failed to save diagnosis addendum"),
  });

  const hasAddendum = provisionalAddendum.trim() || finalAddendum.trim();

  const handleSave = () => {
    const prov = data.provisional_diagnosis ?? [];
    const fin = data.final_diagnosis ?? [];

    mutate({
      provisional_diagnosis: [
        prov[0] ?? "",
        provisionalAddendum.trim()
          ? (prov[1] ?? "") +
            getAddendumSeparator() +
            provisionalAddendum.trim()
          : (prov[1] ?? ""),
      ],
      final_diagnosis: [
        fin[0] ?? "",
        finalAddendum.trim()
          ? (fin[1] ?? "") + getAddendumSeparator() + finalAddendum.trim()
          : (fin[1] ?? ""),
      ],
      status: "COMPLETED",
    });
  };

  return (
    <SectionCard
      title="Diagnosis"
      status={data.status}
      footer={
        hasAddendum ? (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="bg-[#5164E8] hover:bg-[#4153D7] text-white text-xs"
          >
            {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Save Addendum
          </Button>
        ) : null
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <h4 className="text-sm font-medium text-[#1F2937] mb-3">
            Provisional Diagnosis
          </h4>
          <PreviewField
            label="ICD-10 Code"
            value={data.provisional_diagnosis?.[0]}
          />
          <AddendumField
            label="Diagnosis Notes"
            originalValue={data.provisional_diagnosis?.[1]}
            addendumValue={provisionalAddendum}
            onChange={setProvisionalAddendum}
          />
        </div>
        <div>
          <h4 className="text-sm font-medium text-[#1F2937] mb-3">
            Final Diagnosis
          </h4>
          <PreviewField label="ICD-10 Code" value={data.final_diagnosis?.[0]} />
          <AddendumField
            label="Diagnosis Notes"
            originalValue={data.final_diagnosis?.[1]}
            addendumValue={finalAddendum}
            onChange={setFinalAddendum}
          />
        </div>
      </div>
    </SectionCard>
  );
}

function TreatmentAddendum({
  consultationId,
  data,
}: {
  consultationId: string;
  data: { _id?: string; treatment_plan_details?: string; status?: string };
}) {
  const [addendum, setAddendum] = useState("");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: {
      treatment_plan_details: string;
      status: "COMPLETED" | "INCOMPLETE";
    }) =>
      data._id
        ? updateTreatmentPlanForConsultationReq(payload, data._id)
        : createTreatmentPlanForConsultationReq(payload, consultationId),
    onSuccess: () => {
      toast.success("Treatment plan addendum saved");
      setAddendum("");
      queryClient.invalidateQueries({
        queryKey: ["consultation-treatment", consultationId],
      });
    },
    onError: () => toast.error("Failed to save treatment addendum"),
  });

  const handleSave = () => {
    const original = data.treatment_plan_details ?? "";
    mutate({
      treatment_plan_details: addendum.trim()
        ? original + getAddendumSeparator() + addendum.trim()
        : original,
      status: "COMPLETED",
    });
  };

  return (
    <SectionCard
      title="Treatment Plan"
      status={data.status}
      footer={
        addendum.trim() ? (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="bg-[#5164E8] hover:bg-[#4153D7] text-white text-xs"
          >
            {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Save Addendum
          </Button>
        ) : null
      }
    >
      <AddendumField
        label="Treatment Details"
        originalValue={data.treatment_plan_details}
        addendumValue={addendum}
        onChange={setAddendum}
      />
    </SectionCard>
  );
}

// ─── Main component ──────────────────────────────────────────────────────

export function ConsultationPreview({
  consultationId,
  mode,
  onPublish,
  onBack,
  isPublishing,
}: {
  consultationId: string;
  mode: "edit" | "addendum" | "preview";
  onPublish?: () => void;
  onBack?: () => void;
  isPublishing?: boolean;
}) {
  const { data: historyRes, isLoading: l1 } = useQuery({
    queryKey: ["consultation-history", consultationId],
    queryFn: () => getHistoryTakingForConsultationReq(consultationId),
    enabled: !!consultationId,
    retry: false,
  });

  const { data: physicalRes, isLoading: l2 } = useQuery({
    queryKey: ["consultation-physical", consultationId],
    queryFn: () => getPhysicalExamForConsultationReq(consultationId),
    enabled: !!consultationId,
    retry: false,
  });

  const { data: investigationRes, isLoading: l3 } = useQuery({
    queryKey: ["consultation-investigation", consultationId],
    queryFn: () => getInvestigationForConsultationReq(consultationId),
    enabled: !!consultationId,
    retry: false,
  });

  const { data: diagnosisRes, isLoading: l4 } = useQuery({
    queryKey: ["consultation-diagnosis", consultationId],
    queryFn: () => getDiagnosisForConsultationReq(consultationId),
    enabled: !!consultationId,
    retry: false,
  });

  const { data: treatmentRes, isLoading: l5 } = useQuery({
    queryKey: ["consultation-treatment", consultationId],
    queryFn: () => getTreatmentPlanForConsultationReq(consultationId),
    enabled: !!consultationId,
    retry: false,
  });

  if (l1 || l2 || l3 || l4 || l5) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5164E8]" />
      </div>
    );
  }

  const hData = historyRes?.data;
  const pData = physicalRes?.data;
  const iData = investigationRes?.data;
  const dData = diagnosisRes?.data;
  const tData = treatmentRes?.data;

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] overflow-y-auto">
      <div className="p-4 sm:p-6 lg:p-8 mx-auto w-full">
        {/* ─── Addendum mode: greyed original + editable addendum per section ─── */}
        {mode === "addendum" ? (
          <>
            <HistoryAddendum
              consultationId={consultationId}
              data={
                (hData || {}) as Record<string, string | string[]> & {
                  _id?: string;
                }
              }
            />
            <PhysicalExamAddendum
              consultationId={consultationId}
              data={(pData || {}) as Record<string, string> & { _id?: string }}
            />
            <InvestigationAddendum
              consultationId={consultationId}
              data={(iData || {}) as Record<string, string> & { _id?: string }}
            />
            <DiagnosisAddendum
              consultationId={consultationId}
              data={dData || {}}
            />
            <TreatmentAddendum
              consultationId={consultationId}
              data={tData || {}}
            />
          </>
        ) : (
          /* ─── Read-only preview (for both "preview" and "edit" preview-before-publish) ─── */
          <>
            <SectionCard title="History Taking" status={hData?.status}>
              <div className="space-y-4">
                <PreviewField
                  label="Present Complaint"
                  value={hData?.present_complaint}
                />
                <PreviewField
                  label="History of Presenting Complaint"
                  value={hData?.history_of_presenting_complaint}
                />
                <PreviewField
                  label="Past Medical & Surgical History"
                  value={hData?.past_medical_surgical_history}
                />
                <PreviewField
                  label="Family History"
                  value={hData?.family_history}
                />
                <PreviewField
                  label="Social History"
                  value={hData?.social_history}
                />
                <PreviewField
                  label="Drug / Medication History"
                  value={hData?.medication_history}
                />
                <PreviewField
                  label="Allergies"
                  value={hData?.allergy_history}
                />
                <PreviewField label="Occupation" value={hData?.occupation} />
                <PreviewField
                  label="Travel History"
                  value={hData?.travel_history}
                />
                <PreviewField
                  label="Obstetric / Gynaecological"
                  value={hData?.obstetric_gynaecological_history}
                />
                <PreviewField label="Others" value={hData?.others} />
              </div>
            </SectionCard>

            <SectionCard title="Physical Exam" status={pData?.status}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-4">
                  <PreviewField
                    label="General Physical"
                    value={pData?.general_physical}
                  />
                  <PreviewField
                    label="Respiratory System"
                    value={pData?.respiratory_system}
                  />
                  <PreviewField
                    label="Gastrointestinal System"
                    value={pData?.gastrointestinal_system}
                  />
                  <PreviewField
                    label="Musculoskeletal System"
                    value={pData?.musculoskeletal_system}
                  />
                  <PreviewField
                    label="Obstetric / Gynaecological"
                    value={pData?.obstetric_gynaecological}
                  />
                </div>
                <div className="space-y-4">
                  <PreviewField
                    label="Nervous System"
                    value={pData?.nervous_system}
                  />
                  <PreviewField
                    label="Cardiovascular System"
                    value={pData?.cardiovascular_system}
                  />
                  <PreviewField
                    label="Genitourinary System"
                    value={pData?.genitourinary_system}
                  />
                  <PreviewField label="ENT" value={pData?.ENT} />
                  <PreviewField label="Others" value={pData?.others} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Investigation Results" status={iData?.status}>
              <div className="space-y-4">
                <PreviewField label="Blood Tests" value={iData?.blood_test} />
                <PreviewField
                  label="Microbiology"
                  value={iData?.microbiology}
                />
                <PreviewField label="Radiology" value={iData?.radiology} />
                <PreviewField
                  label="Cardiovascular"
                  value={iData?.cardiovascular}
                />
                <PreviewField label="Procedures" value={iData?.procedures} />
                <PreviewField label="Others" value={iData?.others} />
              </div>
            </SectionCard>

            <SectionCard title="Diagnosis" status={dData?.status}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <h4 className="text-sm font-medium text-[#1F2937] mb-3">
                    Provisional Diagnosis
                  </h4>
                  <PreviewField
                    label="ICD-10 Code"
                    value={dData?.provisional_diagnosis?.[0]}
                  />
                  <PreviewField
                    label="Notes"
                    value={dData?.provisional_diagnosis?.[1]}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#1F2937] mb-3">
                    Final Diagnosis
                  </h4>
                  <PreviewField
                    label="ICD-10 Code"
                    value={dData?.final_diagnosis?.[0]}
                  />
                  <PreviewField
                    label="Notes"
                    value={dData?.final_diagnosis?.[1]}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Treatment Plan" status={tData?.status}>
              <PreviewField
                label="Treatment Details"
                value={tData?.treatment_plan_details}
              />
            </SectionCard>
          </>
        )}

        {/* Footer actions (preview-before-publish only) */}
        {mode === "edit" && onPublish && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-4 sm:mt-8 pb-4">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="w-full sm:w-auto"
              >
                Back to Editor
              </Button>
            )}
            <Button
              className="bg-[#5164E8] hover:bg-[#4153D7] text-white w-full sm:w-auto"
              onClick={onPublish}
              disabled={isPublishing}
            >
              {isPublishing && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              <Rocket className="w-4 h-4 mr-2" />
              Publish Consultation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
