import { User, ChevronDown, ChevronRight, Loader2, Beaker } from "lucide-react";
import { useState } from "react";
import { differenceInYears, format } from "date-fns";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getPatientConsultationHistoryreq,
  getPatientMedicationHistoryreq,
  getPatientInvestigationHistoryReq,
  getPatientReferralHistoryreq,
} from "@/config/service/doctor.service";
import { formatZonedDate, formatZonedTimeRange } from "@/lib/utils";
import {
  formatInvestigationLabel,
  getInvestigationDisplayFields,
} from "@/shared/utils/investigation-display.util";
import { ConsultationHistoryPreviewSheet } from "./consultation-history-preview-sheet.component.doctor";
import {
  InvestigationResultPreviewSheet,
  type InvestigationResultPreviewContext,
} from "./investigation-result-preview-sheet.component.doctor";
import { ReferralHistoryPreviewSheet } from "./referral-history-preview-sheet.component.doctor";
import { displayMrn } from "@/lib/mrn";

// interface ReferralRecord {
//   date: string;
//   bookingRef: string;
//   referral: string;
// }

// const referrals: ReferralRecord[] = [
//   {
//     date: "2026-02-15",
//     bookingRef: "BK-0892",
//     referral: "Cardiology - Dr. Martinez",
//   },
// ];

// Number of history rows shown per section before the "See more" affordance.
const HISTORY_PAGE_SIZE = 5;

interface PatientSidebarProps {
  patient?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    id?: string;
    _id?: string;
    mrn?: string;
    date_of_birth?: string;
    address?: string;
    marital_status?: string;
    occupation?: string;
    allergies?: string[];
    previous_medical_conditions?: string[];
    profile_picture_url?: string;
  };
}

export function PatientDataSidebar({ patient }: PatientSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "consultations",
  );
  const [previewConsultationId, setPreviewConsultationId] = useState<
    string | null
  >(null);
  const [previewReferralId, setPreviewReferralId] = useState<string | null>(
    null,
  );
  const [expandedInvestigationGroup, setExpandedInvestigationGroup] = useState<
    string | null
  >(null);
  const [investigationResultPreview, setInvestigationResultPreview] =
    useState<InvestigationResultPreviewContext | null>(null);

  // Show the newest five rows per section; "See more" grows the window and the
  // list stays scrollable, so the panel never grows past a comfortable glance.
  const [consultationsLimit, setConsultationsLimit] =
    useState(HISTORY_PAGE_SIZE);
  const [medicationsLimit, setMedicationsLimit] = useState(HISTORY_PAGE_SIZE);
  const [investigationsLimit, setInvestigationsLimit] =
    useState(HISTORY_PAGE_SIZE);
  const [referralsLimit, setReferralsLimit] = useState(HISTORY_PAGE_SIZE);

  const patientId = patient?._id || patient?.id || "";

  const {
    data: consultationsData,
    isLoading: consultationsLoading,
    isFetching: consultationsFetching,
  } = useQuery({
    queryKey: ["patient-consultation-history", patientId, consultationsLimit],
    queryFn: () =>
      getPatientConsultationHistoryreq(patientId, {
        limit: String(consultationsLimit),
      }),
    enabled: !!patientId,
    placeholderData: keepPreviousData,
  });

  const {
    data: medicationsData,
    isLoading: medicationsLoading,
    isFetching: medicationsFetching,
  } = useQuery({
    queryKey: ["patient-medication-history", patientId, medicationsLimit],
    queryFn: () =>
      getPatientMedicationHistoryreq(patientId, {
        limit: String(medicationsLimit),
      }),
    enabled: !!patientId,
    placeholderData: keepPreviousData,
  });

  const {
    data: investigationsData,
    isLoading: investigationsLoading,
    isFetching: investigationsFetching,
  } = useQuery({
    queryKey: ["patient-investigation-history", patientId, investigationsLimit],
    queryFn: () =>
      getPatientInvestigationHistoryReq(patientId, {
        page: "1",
        perPage: String(investigationsLimit),
      }),
    enabled: !!patientId,
    placeholderData: keepPreviousData,
  });

  const {
    data: referralsData,
    isLoading: referralsLoading,
    isFetching: referralsFetching,
  } = useQuery({
    queryKey: ["patient-referral-history", patientId, referralsLimit],
    queryFn: () =>
      getPatientReferralHistoryreq(patientId, {
        limit: String(referralsLimit),
      }),
    enabled: !!patientId,
    placeholderData: keepPreviousData,
  });

  const consultations = consultationsData?.data ?? [];
  const medications = medicationsData?.data ?? [];
  const investigationGroups = investigationsData?.data?.groups ?? [];
  const referrals = referralsData?.data ?? [];
  const previewConsultation = consultations.find(
    (consult) => consult._id === previewConsultationId,
  );
  const previewReferral = referrals.find(
    (referral) => referral._id === previewReferralId,
  );

  // A full page back means there is (probably) more to fetch; a short page is
  // the end of the list, so the "See more" affordance disappears.
  const hasMoreConsultations = consultations.length >= consultationsLimit;
  const hasMoreMedications = medications.length >= medicationsLimit;
  const hasMoreInvestigations =
    investigationGroups.length >= investigationsLimit;
  const hasMoreReferrals = referrals.length >= referralsLimit;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleInvestigationGroup = (groupId: string) => {
    setExpandedInvestigationGroup(
      expandedInvestigationGroup === groupId ? null : groupId,
    );
  };

  const LoadingRow = ({ colSpan }: { colSpan: number }) => (
    <tr>
      <td colSpan={colSpan} className="py-4 text-center">
        <Loader2 className="w-4 h-4 animate-spin inline-block mr-2 text-[#6B7280]" />
        <span className="text-[#6B7280]">Loading...</span>
      </td>
    </tr>
  );

  const patientInitials = `${patient?.first_name?.[0] ?? ""}${patient?.last_name?.[0] ?? ""}`;
  const patientDisplayName =
    patient?.full_name ||
    `${patient?.first_name ?? ""} ${patient?.last_name ?? ""}`.trim();

  const EmptyRow = ({ colSpan, label }: { colSpan: number; label: string }) => (
    <tr>
      <td colSpan={colSpan} className="py-4 text-center text-[#9CA3AF] text-xs">
        No {label} found
      </td>
    </tr>
  );

  const SeeMoreButton = ({
    visible,
    fetching,
    onClick,
  }: {
    visible: boolean;
    fetching: boolean;
    onClick: () => void;
  }) => {
    if (!visible) return null;
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={fetching}
        className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2 py-1.5 text-[11px] font-medium text-[#5164E8] hover:bg-[#EAEDFF] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {fetching ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            See more
            <ChevronDown className="w-3 h-3" />
          </>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white border-r border-[#E5E7EB] overflow-y-auto h-full shadow-sm">
      <div className="p-4 md:p-6">
        {/* Patient Profile Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <Avatar className="w-12 h-12 md:w-16 md:h-16 rounded-xl shrink-0 border border-[#E5E7EB]">
            {patient?.profile_picture_url && (
              <AvatarImage
                src={patient.profile_picture_url}
                alt={patientDisplayName || "Patient"}
                className="object-cover"
              />
            )}
            <AvatarFallback className="rounded-xl bg-[#5164E8] text-white text-base md:text-lg font-semibold">
              {patientInitials || <User className="w-6 h-6 md:w-8 md:h-8" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center">
            <h2 className="text-[#1F2937] font-bold text-base md:text-[17px] leading-tight mb-0.5">
              {patient
                ? patient.full_name ||
                  `${patient.first_name} ${patient.last_name}`
                : "Loading..."}
            </h2>
            <p className="text-[#6B7280] text-sm md:text-[15px]">
              {patient ? `MRN: ${displayMrn(patient.mrn)}` : "Loading..."}
            </p>
          </div>
        </div>

        {/* Patient Info Stack */}
        <div className="space-y-3 mb-6 text-sm">
          <div className="text-[#4B5563] space-y-1">
            <p>
              <span className="font-semibold">Age:</span>{" "}
              {patient?.date_of_birth
                ? differenceInYears(new Date(), new Date(patient.date_of_birth))
                : "-"}{" "}
              years
            </p>
            <p>
              <span className="font-semibold">DOB:</span>{" "}
              {patient?.date_of_birth
                ? new Date(patient.date_of_birth).toISOString().split("T")[0]
                : "-"}
            </p>
            <p>
              <span className="font-semibold">Address:</span>{" "}
              {patient?.address || "-"}
            </p>
            <p>
              <span className="font-semibold">Marital Status:</span>{" "}
              {patient?.marital_status || "-"}
            </p>
            <p>
              <span className="font-semibold">Occupation:</span>{" "}
              {patient?.occupation || "-"}
            </p>
          </div>

          {/* Allergies */}
          <div className="mt-3">
            <span className="text-[#4B5563] font-semibold">Allergies:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {patient?.allergies?.length ? (
                patient.allergies.map((a: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[#F3F4F6] text-[#374151] rounded-full text-xs"
                  >
                    {a}
                  </span>
                ))
              ) : (
                <span className="px-3 py-1 bg-[#F3F4F6] text-[#374151] rounded-full text-xs">
                  No Known Allergy
                </span>
              )}
            </div>
          </div>

          {/* Medical Conditions */}
          <div className="mt-3">
            <span className="text-[#4B5563] font-semibold">Conditions:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {patient?.previous_medical_conditions?.length ? (
                patient.previous_medical_conditions.map(
                  (c: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#F3F4F6] text-[#374151] rounded-full text-xs"
                    >
                      {c}
                    </span>
                  ),
                )
              ) : (
                <span className="px-3 py-1 bg-[#F3F4F6] text-[#374151] rounded-full text-xs">
                  No Known Conditions
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Cards */}
        <div className="space-y-3 text-xs">
          {/* Consultations */}
          <div className="bg-[#F9FAFB] rounded-lg overflow-hidden border border-[#E5E7EB]">
            <button
              onClick={() => toggleSection("consultations")}
              className="w-full flex items-center justify-between p-4 hover:bg-[#F3F4F6] transition-colors"
            >
              <span className="text-[#1F2937] font-semibold">
                Consultations
              </span>
              {expandedSection === "consultations" ? (
                <ChevronDown className="w-5 h-5 text-[#6B7280]" />
              ) : (
                <ChevronRight className="w-5 h-5 text-[#6B7280]" />
              )}
            </button>
            {expandedSection === "consultations" && (
              <div className="p-4 pt-0">
                <div className="overflow-x-auto">
                  <div className="max-h-[20rem] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 z-10 bg-[#F9FAFB]">
                        <tr className="text-[#6B7280] border-b border-[#E5E7EB]">
                          <th className="text-left py-2 px-1">ID</th>
                          <th className="text-left py-2 px-1">Date</th>
                          <th className="text-left py-2 px-1">Time</th>
                          <th className="text-left py-2 px-1">Doctor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consultationsLoading ? (
                          <LoadingRow colSpan={4} />
                        ) : consultations.length === 0 ? (
                          <EmptyRow colSpan={4} label="consultations" />
                        ) : (
                          consultations.map((consult) => {
                            const scheduledStart =
                              consult.appointment_id?.scheduled_start_at_utc;
                            const scheduledEnd =
                              consult.appointment_id?.scheduled_end_at_utc;

                            const displayDate = scheduledStart
                              ? formatZonedDate(scheduledStart, {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                })
                              : format(
                                  new Date(consult.createdAt),
                                  "yyyy-MM-dd",
                                );

                            const displayTime =
                              scheduledStart && scheduledEnd
                                ? formatZonedTimeRange(
                                    scheduledStart,
                                    scheduledEnd,
                                    { spacedMeridiem: false },
                                  )
                                : "—";

                            const doctorName =
                              consult.doctor_id?.full_name ||
                              (consult.doctor_id?.first_name &&
                              consult.doctor_id?.last_name
                                ? `Dr. ${consult.doctor_id.first_name} ${consult.doctor_id.last_name}`
                                : consult.doctor_id?.last_name
                                  ? `Dr. ${consult.doctor_id.last_name}`
                                  : "—");

                            return (
                              <tr
                                key={consult._id}
                                onClick={() =>
                                  setPreviewConsultationId(consult._id)
                                }
                                className="text-[#374151] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
                              >
                                <td className="py-2 px-1 font-medium">
                                  {consult.appointment_id?.appointment_number ||
                                    consult.session_number ||
                                    "—"}
                                </td>
                                <td className="py-2 px-1 whitespace-nowrap">
                                  {displayDate}
                                </td>
                                <td className="py-2 px-1 whitespace-nowrap">
                                  {displayTime}
                                </td>
                                <td className="py-2 px-1">{doctorName}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <SeeMoreButton
                  visible={hasMoreConsultations}
                  fetching={consultationsFetching}
                  onClick={() =>
                    setConsultationsLimit((prev) => prev + HISTORY_PAGE_SIZE)
                  }
                />
              </div>
            )}
          </div>

          {/* Investigations */}
          <div className="bg-[#F9FAFB] rounded-lg overflow-hidden border border-[#E5E7EB]">
            <button
              onClick={() => toggleSection("investigations")}
              className="w-full flex items-center justify-between p-4 hover:bg-[#F3F4F6] transition-colors"
            >
              <span className="text-[#1F2937] font-semibold">
                Investigations
              </span>
              {expandedSection === "investigations" ? (
                <ChevronDown className="w-5 h-5 text-[#6B7280]" />
              ) : (
                <ChevronRight className="w-5 h-5 text-[#6B7280]" />
              )}
            </button>
            {expandedSection === "investigations" && (
              <div className="p-4 pt-0">
                {investigationsLoading ? (
                  <div className="py-4 text-center text-[#6B7280]">
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                    Loading...
                  </div>
                ) : investigationGroups.length === 0 ? (
                  <p className="py-4 text-center text-[#9CA3AF] text-xs">
                    No investigations found
                  </p>
                ) : (
                  <div className="max-h-[13rem] overflow-y-auto space-y-2">
                    {investigationGroups.map((group, index) => {
                      const consultation = group.consultation;
                      const groupId =
                        consultation?._id ||
                        group.investigations?.[0]?.consultation_id ||
                        `group-${index}`;
                      const appointment = consultation?.appointment_id;
                      const scheduledStart =
                        appointment?.scheduled_start_at_utc;

                      const groupDate = scheduledStart
                        ? formatZonedDate(scheduledStart, {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })
                        : consultation?.createdAt
                          ? format(
                              new Date(consultation.createdAt),
                              "yyyy-MM-dd",
                            )
                          : "—";

                      const groupLabel =
                        appointment?.appointment_number ||
                        consultation?.title ||
                        "Consultation";

                      const isGroupExpanded =
                        expandedInvestigationGroup === groupId;

                      return (
                        <div
                          key={groupId}
                          className="rounded-lg border border-[#E5E7EB] overflow-hidden bg-white"
                        >
                          <button
                            type="button"
                            onClick={() => toggleInvestigationGroup(groupId)}
                            className="w-full flex items-center justify-between gap-2 p-3 hover:bg-[#F3F4F6] transition-colors text-left"
                          >
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              <div className="w-7 h-7 rounded-md bg-[#EAEDFF] flex items-center justify-center shrink-0">
                                <Beaker className="w-3.5 h-3.5 text-[#5164E8]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#374151] truncate">
                                  {groupLabel}
                                </p>
                                <p className="text-[10px] text-[#6B7280] mt-0.5">
                                  {groupDate} · {group.investigation_count}{" "}
                                  {group.investigation_count === 1
                                    ? "test"
                                    : "tests"}
                                </p>
                              </div>
                            </div>
                            {isGroupExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[#6B7280] shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-[#6B7280] shrink-0" />
                            )}
                          </button>

                          {isGroupExpanded && (
                            <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 space-y-2">
                              {group.investigations.map((inv) => {
                                const { category, priority, specimen } =
                                  getInvestigationDisplayFields(inv);
                                const main = formatInvestigationLabel(inv);
                                const metaParts = [
                                  category && category !== "Other"
                                    ? `Category: ${category}`
                                    : "",
                                  specimen && specimen !== "-"
                                    ? `Specimen: ${specimen}`
                                    : "",
                                ].filter(Boolean);
                                const hasResults =
                                  (inv.result_images?.length ?? 0) > 0;

                                return (
                                  <div
                                    key={inv._id}
                                    role={hasResults ? "button" : undefined}
                                    tabIndex={hasResults ? 0 : undefined}
                                    onClick={() => {
                                      if (!hasResults) return;
                                      setInvestigationResultPreview({
                                        investigation: inv,
                                        consultation,
                                      });
                                    }}
                                    onKeyDown={(event) => {
                                      if (
                                        !hasResults ||
                                        (event.key !== "Enter" &&
                                          event.key !== " ")
                                      ) {
                                        return;
                                      }
                                      event.preventDefault();
                                      setInvestigationResultPreview({
                                        investigation: inv,
                                        consultation,
                                      });
                                    }}
                                    className={`rounded-md border border-[#E5E7EB] bg-white px-2.5 py-2 ${
                                      hasResults
                                        ? "cursor-pointer hover:border-[#5164E8]/50 hover:bg-[#F8F9FF] transition-colors"
                                        : ""
                                    }`}
                                  >
                                    <div className="font-medium text-[12px] leading-tight text-[#374151]">
                                      {main}
                                    </div>
                                    {metaParts.length > 0 && (
                                      <div className="text-[10px] text-[#6B7280] mt-0.5 leading-tight line-clamp-2">
                                        {metaParts.join(" • ")}
                                      </div>
                                    )}
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                      {priority && (
                                        <span
                                          className={`inline-block text-[9px] px-1.5 py-px rounded ${
                                            priority.toLowerCase() === "stat"
                                              ? "bg-red-100 text-red-700"
                                              : priority.toLowerCase() ===
                                                  "urgent"
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-violet-100 text-violet-700"
                                          }`}
                                        >
                                          {priority}
                                        </span>
                                      )}
                                      {inv.result_images?.length ? (
                                        <span className="text-[9px] px-1.5 py-px rounded bg-green-100 text-green-700">
                                          Results uploaded
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <SeeMoreButton
                  visible={hasMoreInvestigations}
                  fetching={investigationsFetching}
                  onClick={() =>
                    setInvestigationsLimit((prev) => prev + HISTORY_PAGE_SIZE)
                  }
                />
              </div>
            )}
          </div>

          {/* Medications */}
          <div className="bg-[#F9FAFB] rounded-lg overflow-hidden border border-[#E5E7EB]">
            <button
              onClick={() => toggleSection("medications")}
              className="w-full flex items-center justify-between p-4 hover:bg-[#F3F4F6] transition-colors"
            >
              <span className="text-[#1F2937] font-semibold">Medications</span>
              {expandedSection === "medications" ? (
                <ChevronDown className="w-5 h-5 text-[#6B7280]" />
              ) : (
                <ChevronRight className="w-5 h-5 text-[#6B7280]" />
              )}
            </button>
            {expandedSection === "medications" && (
              <div className="p-4 pt-0">
                <div className="overflow-x-auto">
                  <div className="max-h-[13rem] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[#6B7280] border-b border-[#E5E7EB]">
                          <th className="text-left py-2 px-1">Date</th>
                          <th className="text-left py-2 px-1">Medication</th>
                          <th className="text-left py-2 px-1">Dose</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicationsLoading ? (
                          <LoadingRow colSpan={3} />
                        ) : medications.length === 0 ? (
                          <EmptyRow colSpan={3} label="medications" />
                        ) : (
                          medications.map((med) => (
                            <tr
                              key={med._id}
                              className="text-[#374151] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
                            >
                              <td className="py-2 px-1">
                                {format(new Date(med.createdAt), "yyyy-MM-dd")}
                              </td>
                              <td className="py-2 px-1">{med.medication}</td>
                              <td className="py-2 px-1">
                                {med.dose} {med.unit}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <SeeMoreButton
                  visible={hasMoreMedications}
                  fetching={medicationsFetching}
                  onClick={() =>
                    setMedicationsLimit((prev) => prev + HISTORY_PAGE_SIZE)
                  }
                />
              </div>
            )}
          </div>

          {/* Referrals */}
          <div className="bg-[#F9FAFB] rounded-lg overflow-hidden border border-[#E5E7EB]">
            <button
              onClick={() => toggleSection("referrals")}
              className="w-full flex items-center justify-between p-4 hover:bg-[#F3F4F6] transition-colors"
            >
              <span className="text-[#1F2937] font-semibold">Referrals</span>
              {expandedSection === "referrals" ? (
                <ChevronDown className="w-5 h-5 text-[#6B7280]" />
              ) : (
                <ChevronRight className="w-5 h-5 text-[#6B7280]" />
              )}
            </button>
            {expandedSection === "referrals" && (
              <div className="p-4 pt-0">
                {referralsLoading ? (
                  <div className="py-4 text-center text-[#6B7280]">
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                    Loading...
                  </div>
                ) : referrals.length === 0 ? (
                  <p className="py-4 text-center text-[#9CA3AF] text-xs">
                    No referrals created
                  </p>
                ) : (
                  <div className="max-h-[13rem] overflow-y-auto space-y-2">
                    {referrals.map((ref) => (
                      <div
                        key={ref._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setPreviewReferralId(ref._id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setPreviewReferralId(ref._id);
                          }
                        }}
                        className="p-2 border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#F3F4F6] cursor-pointer transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5164E8]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-[11px] text-[#374151]">
                              {ref.referred_doctor_name ||
                                ref.specialist_name ||
                                "Specialist"}
                            </div>
                            <div className="text-[10px] text-[#6B7280]">
                              {ref.hospital || "Hospital not specified"}
                            </div>
                            <div className="text-[10px] text-[#6B7280] mt-0.5">
                              {formatZonedDate(ref.createdAt, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                                ref.assign_to_patient
                                  ? "bg-green-50 text-green-600"
                                  : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {ref.assign_to_patient ? "Assigned" : "Pending"}
                            </span>
                            <ChevronRight
                              size={14}
                              className="text-[#6B7280]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <SeeMoreButton
                  visible={hasMoreReferrals}
                  fetching={referralsFetching}
                  onClick={() =>
                    setReferralsLimit((prev) => prev + HISTORY_PAGE_SIZE)
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ConsultationHistoryPreviewSheet
        consultationId={previewConsultationId}
        open={!!previewConsultationId}
        onOpenChange={(open) => {
          if (!open) setPreviewConsultationId(null);
        }}
        doctor={previewConsultation?.doctor_id}
      />

      <InvestigationResultPreviewSheet
        context={investigationResultPreview}
        open={!!investigationResultPreview}
        onOpenChange={(open) => {
          if (!open) setInvestigationResultPreview(null);
        }}
      />

      <ReferralHistoryPreviewSheet
        patientId={patientId}
        referralId={previewReferralId}
        fallback={previewReferral ?? null}
        open={!!previewReferralId}
        onOpenChange={(open) => {
          if (!open) setPreviewReferralId(null);
        }}
      />
    </div>
  );
}
