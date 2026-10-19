import {
  Calendar,
  FileText,
  Loader2,
  MapPin,
  Paperclip,
  Pill,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getPatientReferralHistoryRecordReq,
  type PatientReferralHistoryConsultation,
  type PatientReferralHistoryDoctor,
  type PatientReferralHistoryRecord,
} from "@/config/service/doctor.service";
import { formatZonedDate } from "@/lib/utils";

interface ReferralHistoryPreviewSheetProps {
  patientId: string;
  referralId: string | null;
  /** Sidebar row — rendered immediately while the fresh record loads. */
  fallback?: PatientReferralHistoryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Both guards accept `| undefined` because their only call sites read through
 * optional chaining (`referral?.doctor_id`), where the record itself may be
 * null while the fresh lookup is in flight. The body already treats a falsy
 * value as "not populated", so widening the parameter is what the predicate
 * claimed all along.
 */
function isConsultation(
  value: PatientReferralHistoryRecord["consultation_id"] | undefined,
): value is PatientReferralHistoryConsultation {
  return !!value && typeof value === "object";
}

function isDoctor(
  value: PatientReferralHistoryRecord["doctor_id"] | undefined,
): value is PatientReferralHistoryDoctor {
  return !!value && typeof value === "object";
}

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: React.ReactNode;
  icon?: typeof Calendar;
}) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1">
        {label}
      </p>
      <div className="flex items-start gap-2 text-sm text-[#374151]">
        {Icon && <Icon className="w-4 h-4 shrink-0 text-[#6B7280] mt-0.5" />}
        <span className="break-words">{value}</span>
      </div>
    </div>
  );
}

function SummarySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-[#1F2937] uppercase tracking-wide">
        {title}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export function ReferralHistoryPreviewSheet({
  patientId,
  referralId,
  fallback,
  open,
  onOpenChange,
}: ReferralHistoryPreviewSheetProps) {
  const { data, isFetching } = useQuery({
    queryKey: ["patient-referral-record", patientId, referralId],
    queryFn: () =>
      getPatientReferralHistoryRecordReq(patientId, referralId as string),
    enabled: open && !!patientId && !!referralId,
  });

  // Prefer the freshly fetched record; fall back to the list row so the sheet
  // opens instantly instead of flashing a spinner.
  const referral = data?.data ?? fallback ?? null;
  const showLoading = !referral && isFetching;
  const isRefreshing = isFetching && !!referral;

  const referringDoctor = isDoctor(referral?.doctor_id)
    ? referral.doctor_id
    : undefined;
  const consultation = isConsultation(referral?.consultation_id)
    ? referral.consultation_id
    : undefined;

  const referralDate = referral?.createdAt
    ? formatZonedDate(referral.createdAt, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : undefined;

  const attachmentCount = referral?.attachment_investigation_ids?.length ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col overflow-hidden"
      >
        <SheetHeader className="px-4 sm:px-6 pt-6 pb-4 border-b border-[#E5E7EB] shrink-0 pr-12 space-y-3">
          <div className="space-y-2">
            <SheetTitle className="text-lg font-semibold text-[#1F2937] text-left">
              {referral?.specialist_name || "Referral Details"}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Referral summary
            </SheetDescription>
            {referral && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    referral.assign_to_patient
                      ? "bg-green-50 text-green-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {referral.assign_to_patient ? "Assigned" : "Pending"}
                </span>
                {referral.specialty && (
                  <span className="text-xs text-[#6B7280]">
                    {referral.specialty}
                  </span>
                )}
                {isRefreshing && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#6B7280]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Updating…
                  </span>
                )}
              </div>
            )}
          </div>
        </SheetHeader>

        {showLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#5164E8]" />
          </div>
        ) : !referral ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <p className="text-sm text-[#6B7280]">
              Unable to load this referral. Please try again.
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 sm:p-5 space-y-5">
              <SummarySection title="Overview">
                <InfoItem
                  label="Date of Referral"
                  value={referralDate}
                  icon={Calendar}
                />
                <InfoItem
                  label="Specialist"
                  value={referral.specialist_name}
                  icon={Stethoscope}
                />
                <InfoItem
                  label="Specialty"
                  value={referral.specialty}
                  icon={Stethoscope}
                />
                <InfoItem
                  label="Referred Doctor"
                  value={referral.referred_doctor_name}
                  icon={UserRound}
                />
                <InfoItem
                  label="Hospital"
                  value={referral.hospital}
                  icon={MapPin}
                />
                <InfoItem
                  label="Hospital Address"
                  value={referral.hospital_address?.join(", ")}
                  icon={MapPin}
                />
              </SummarySection>

              {referringDoctor && (
                <div className="border-t border-[#E5E7EB] pt-5">
                  <SummarySection title="Referring Doctor">
                    <InfoItem
                      label="Name"
                      value={referringDoctor.full_name}
                      icon={UserRound}
                    />
                    <InfoItem
                      label="Specialty"
                      value={referringDoctor.specializations?.join(", ")}
                      icon={Stethoscope}
                    />
                  </SummarySection>
                </div>
              )}

              {(consultation || attachmentCount > 0) && (
                <div className="border-t border-[#E5E7EB] pt-5">
                  <SummarySection title="Context">
                    <InfoItem
                      label="Consultation"
                      value={consultation?.title}
                      icon={FileText}
                    />
                    <InfoItem
                      label="Attached Results"
                      value={
                        attachmentCount > 0
                          ? `${attachmentCount} ${
                              attachmentCount === 1
                                ? "investigation"
                                : "investigations"
                            }`
                          : undefined
                      }
                      icon={Paperclip}
                    />
                  </SummarySection>
                </div>
              )}

              {referral.referral_details && (
                <div className="border-t border-[#E5E7EB] pt-5 space-y-2">
                  <h4 className="text-xs font-semibold text-[#1F2937] uppercase tracking-wide">
                    Clinical Summary
                  </h4>
                  <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 text-sm text-[#374151] leading-relaxed whitespace-pre-wrap break-words">
                    {referral.referral_details}
                  </div>
                </div>
              )}

              {referral.current_medications && (
                <div className="border-t border-[#E5E7EB] pt-5 space-y-2">
                  <h4 className="text-xs font-semibold text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-[#6B7280]" />
                    Current Medications
                  </h4>
                  <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 text-sm text-[#374151] leading-relaxed whitespace-pre-wrap break-words">
                    {referral.current_medications}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
