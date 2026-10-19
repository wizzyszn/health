import type { ReactNode } from "react";
import { ChevronRight, FileText, Pill, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { PatientRecordGroupSkeleton } from "@/shared/components/patient-record-skeletons.component.shared";

/**
 * The summary is assembled and visibility-gated server-side; this tab only lays
 * it out, so the payload is left loose rather than re-declared as a second
 * source of truth that could drift from the endpoint.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SummaryPayload = any;

interface ConsultationSummaryTabProps {
  isLoading: boolean;
  isError: boolean;
  summary: SummaryPayload;
  onOpenMedication: () => void;
  onOpenInvestigation: () => void;
  onOpenReferral: () => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-[#F7F7F7] p-4">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

function StatCard({
  icon,
  label,
  value,
  hint,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  hint?: string;
  onClick: () => void;
}) {
  const active = value > 0;

  return (
    <button
      type="button"
      onClick={active ? onClick : undefined}
      disabled={!active}
      aria-disabled={!active}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        active
          ? "cursor-pointer border-border bg-white hover:bg-muted/40"
          : "cursor-not-allowed border-border/60 bg-[#F3F4F6] opacity-60",
      )}
    >
      <span
        className={cn(
          "shrink-0 rounded-full border p-2",
          active
            ? "border-primary/20 bg-primary/10 text-primary"
            : "border-border/40 bg-[#E5E7EB] text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">
          {value} {label}
          {value === 1 ? "" : "s"}
        </span>
        {hint && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {hint}
          </span>
        )}
      </span>
      {active && (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
}

export function ConsultationSummaryTab({
  isLoading,
  isError,
  summary,
  onOpenMedication,
  onOpenInvestigation,
  onOpenReferral,
}: ConsultationSummaryTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <PatientRecordGroupSkeleton count={2} />
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Failed to load consultation summary.
      </div>
    );
  }

  // Annotated rather than inferred: `summary` is `any`, so without a declared
  // array type `diagnoses.map(...)` becomes an untyped call and every callback
  // parameter is an implicit `any` under noImplicitAny.
  const diagnoses: SummaryPayload[] = summary.diagnoses ?? [];
  const medicationTotal = summary.medications?.total ?? 0;
  const investigationTotal = summary.investigations?.total ?? 0;
  const pendingInvestigations = summary.investigations?.pending ?? 0;
  const referralTotal = summary.referrals?.total ?? 0;
  const treatmentPlanDetails = summary.treatment_plan?.details;
  // The reason for visit the appointment captured, falling back to what the
  // patient wrote when booking if the appointment carries none.
  const reasonForVisit =
    summary.reason_for_visit ||
    summary.consultation?.details ||
    summary.consultation?.title ||
    "";

  return (
    <div className="space-y-3 md:space-y-4">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          At a glance
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <StatCard
            icon={<Pill className="h-4 w-4" />}
            label="medication"
            value={medicationTotal}
            onClick={onOpenMedication}
          />
          <StatCard
            icon={<FileText className="h-4 w-4" />}
            label="investigation"
            value={investigationTotal}
            hint={
              pendingInvestigations > 0
                ? `${pendingInvestigations} awaiting results`
                : undefined
            }
            onClick={onOpenInvestigation}
          />
          <StatCard
            icon={<Stethoscope className="h-4 w-4" />}
            label="referral"
            value={referralTotal}
            onClick={onOpenReferral}
          />
        </div>
      </section>

      <Section title="Reason for visit">
        <p className="text-sm text-foreground">
          {reasonForVisit || "Not recorded."}
        </p>
      </Section>

      <Section title="Diagnosis">
        {diagnoses.length === 0 ? (
          <EmptyNote>
            No diagnosis was recorded for this consultation.
          </EmptyNote>
        ) : (
          <div className="space-y-2">
            {diagnoses.map((diagnosis) => (
              <div
                key={diagnosis._id}
                className="rounded-md border border-border bg-white px-3 py-2"
              >
                <p className="text-sm font-medium text-foreground">
                  {diagnosis.title}
                </p>
                {diagnosis.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {diagnosis.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Treatment plan">
        {treatmentPlanDetails ? (
          <p className="whitespace-pre-line text-sm text-foreground">
            {treatmentPlanDetails}
          </p>
        ) : (
          <EmptyNote>
            Your doctor has not recorded a treatment plan yet.
          </EmptyNote>
        )}
      </Section>
    </div>
  );
}
