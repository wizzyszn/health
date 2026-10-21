import { useEffect, useState } from "react";
import {
  Calendar,
  ClipboardList,
  Clock,
  FileText,
  Headphones,
  Loader2,
  MapPin,
  Stethoscope,
  UserRound,
  Video,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAConsultationsForDoc } from "@/config/service/doctor.service";
import { formatZonedDate, formatZonedTimeRange } from "@/lib/utils";
import { displayMrn } from "@/lib/mrn";
import {
  getBookingComplaintDetails,
  getBookingReasonForAppointment,
} from "@/shared/utils/appointment-booking-fields.util";
import { ConsultationPreview } from "./consultation-preview.component.doctor";
import { ConsultationStatusBadge } from "./consultation-status-badge.component.doctor";
import { AppointmentStatusBadge } from "./appointment-status-badge.component.doctor";
import type {
  AppointmentStatus,
  ConsultationStatus,
  RawDoctorConsultationDetail,
} from "../types/consultation.types";

type ConsultationType = "VIDEO" | "AUDIO" | "IN_PERSON";

const TYPE_CONFIG: Record<
  ConsultationType,
  { label: string; icon: typeof Video }
> = {
  VIDEO: { label: "Video Consultation", icon: Video },
  AUDIO: { label: "Audio Consultation", icon: Headphones },
  IN_PERSON: { label: "In-Person Consultation", icon: MapPin },
};

function formatList(values?: string[]) {
  if (!values?.length) return undefined;
  return values.join(", ");
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

function resolveDoctorName(
  consultation: RawDoctorConsultationDetail,
  historyDoctor?: ConsultationHistoryPreviewSheetProps["doctor"],
) {
  const appointmentDoctor = consultation.appointment_id?.doctor_id;

  return (
    appointmentDoctor?.full_name ||
    (appointmentDoctor?.first_name && appointmentDoctor?.last_name
      ? `Dr. ${appointmentDoctor.first_name} ${appointmentDoctor.last_name}`
      : undefined) ||
    historyDoctor?.full_name ||
    (historyDoctor?.first_name && historyDoctor?.last_name
      ? `Dr. ${historyDoctor.first_name} ${historyDoctor.last_name}`
      : undefined)
  );
}

function resolveDoctorSpecializations(
  consultation: RawDoctorConsultationDetail,
  historyDoctor?: ConsultationHistoryPreviewSheetProps["doctor"],
) {
  const specializations =
    consultation.appointment_id?.doctor_id?.specializations ??
    historyDoctor?.specializations;

  return specializations?.length ? specializations.join(", ") : undefined;
}

function resolveDoctorProfilePicture(
  consultation: RawDoctorConsultationDetail,
  historyDoctor?: ConsultationHistoryPreviewSheetProps["doctor"],
) {
  return (
    consultation.appointment_id?.doctor_id?.profile_picture_url ||
    historyDoctor?.profile_picture_url
  );
}

function ConsultationDetailsSummary({
  consultation,
  historyDoctor,
  scheduledDate,
  scheduledTime,
  typeLabel,
  TypeIcon,
}: {
  consultation: RawDoctorConsultationDetail;
  historyDoctor?: ConsultationHistoryPreviewSheetProps["doctor"];
  scheduledDate?: string;
  scheduledTime?: string;
  typeLabel: string;
  TypeIcon: typeof Video;
}) {
  const appointment = consultation.appointment_id;
  const doctorName = resolveDoctorName(consultation, historyDoctor);
  const doctorSpecializations = resolveDoctorSpecializations(
    consultation,
    historyDoctor,
  );
  const doctorProfilePicture = resolveDoctorProfilePicture(
    consultation,
    historyDoctor,
  );

  const patientName =
    consultation.user_id?.full_name || appointment?.patient_id?.full_name;
  const patientMrn = displayMrn(consultation.user_id?.mrn);
  const patientProfilePicture =
    consultation.user_id?.profile_picture_url ||
    appointment?.patient_id?.profile_picture_url;

  const hasVisitDetails =
    getBookingReasonForAppointment(appointment) ||
    getBookingComplaintDetails(appointment) ||
    appointment?.allergies?.length ||
    appointment?.Medical_conditions?.length;

  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 sm:p-5 space-y-5">
      <SummarySection title="Overview">
        <InfoItem
          label="Appointment Ref"
          value={appointment?.appointment_number}
          icon={FileText}
        />
        <InfoItem label="Type" value={typeLabel} icon={TypeIcon} />
        {doctorName && (
          <div className="sm:col-span-2 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
              Attending Doctor
            </p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0 border border-[#E5E7EB]">
                {doctorProfilePicture && (
                  <AvatarImage
                    src={doctorProfilePicture}
                    alt={doctorName}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-[#5164E8]/10 text-[#5164E8]">
                  <Stethoscope className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm text-[#374151] font-medium">
                  {doctorName}
                </p>
                {doctorSpecializations && (
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {doctorSpecializations}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        <InfoItem
          label="Consultation For"
          value={consultation.consoltation_for}
          icon={UserRound}
        />
        {patientName && (
          <div className="sm:col-span-2 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
              Patient
            </p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0 border border-[#E5E7EB]">
                {patientProfilePicture && (
                  <AvatarImage
                    src={patientProfilePicture}
                    alt={patientName}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-[#5164E8]/10 text-[#5164E8]">
                  <UserRound className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm text-[#374151] font-medium">
                  {patientName}
                </p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  MRN: {patientMrn}
                </p>
              </div>
            </div>
          </div>
        )}
      </SummarySection>

      <div className="border-t border-[#E5E7EB] pt-5">
        <SummarySection title="Schedule">
          <InfoItem
            label="Scheduled Date"
            value={scheduledDate}
            icon={Calendar}
          />
          <InfoItem
            label="Scheduled Time"
            value={
              scheduledTime
                ? `${scheduledTime}${appointment?.timezone_snapshot ? ` (${appointment.timezone_snapshot})` : ""}`
                : undefined
            }
            icon={Clock}
          />
        </SummarySection>
      </div>

      {hasVisitDetails && (
        <div className="border-t border-[#E5E7EB] pt-5">
          <SummarySection title="Visit Details">
            <InfoItem
              label="Reason for Appointment (visit)"
              value={getBookingReasonForAppointment(appointment)}
            />
            <InfoItem
              label="Complaint Details"
              value={getBookingComplaintDetails(appointment)}
            />
            <InfoItem
              label="Allergies"
              value={formatList(appointment?.allergies)}
            />
            <InfoItem
              label="Medical Conditions"
              value={formatList(appointment?.Medical_conditions)}
            />
          </SummarySection>
        </div>
      )}
    </div>
  );
}

interface ConsultationHistoryPreviewSheetProps {
  consultationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    specializations?: string[];
    profile_picture_url?: string;
  };
}

export function ConsultationHistoryPreviewSheet({
  consultationId,
  open,
  onOpenChange,
  doctor,
}: ConsultationHistoryPreviewSheetProps) {
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (open) setActiveTab("details");
  }, [consultationId, open]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["consultation-detail", consultationId],
    queryFn: () => getAConsultationsForDoc(consultationId!),
    enabled: open && !!consultationId,
  });

  const consultation = data?.data;
  const appointment = consultation?.appointment_id;
  const typeKey = (consultation?.type ?? "VIDEO") as ConsultationType;
  const typeConfig = TYPE_CONFIG[typeKey] ?? TYPE_CONFIG.VIDEO;
  const TypeIcon = typeConfig.icon;

  const scheduledDate = appointment?.scheduled_start_at_utc
    ? formatZonedDate(
        appointment.scheduled_start_at_utc,
        {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        },
        undefined,
        appointment.timezone_snapshot,
      )
    : undefined;

  const scheduledTime =
    appointment?.scheduled_start_at_utc && appointment?.scheduled_end_at_utc
      ? formatZonedTimeRange(
          appointment.scheduled_start_at_utc,
          appointment.scheduled_end_at_utc,
          {
            spacedMeridiem: true,
            timeZone: appointment.timezone_snapshot,
          },
        )
      : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl p-0 flex flex-col overflow-hidden"
      >
        <SheetHeader className="px-4 sm:px-6 pt-6 pb-4 border-b border-[#E5E7EB] shrink-0 pr-12 space-y-3">
          <div className="space-y-2">
            <SheetTitle className="text-lg font-semibold text-[#1F2937] text-left">
              {isLoading
                ? "Loading consultation…"
                : consultation?.title || "Consultation Preview"}
            </SheetTitle>
            {!isLoading && consultation && (
              <div className="flex flex-wrap items-center gap-2">
                <ConsultationStatusBadge
                  status={consultation.status as ConsultationStatus}
                />
                {appointment?.status &&
                  appointment.status !== consultation.status && (
                    <AppointmentStatusBadge
                      status={appointment.status as AppointmentStatus}
                    />
                  )}
              </div>
            )}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#5164E8]" />
          </div>
        ) : isError || !consultation ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <p className="text-sm text-[#6B7280]">
              Unable to load consultation details. Please try again.
            </p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="px-4 sm:px-6 pt-4 pb-3 shrink-0 border-b border-[#E5E7EB]">
              <TabsList className="grid w-full grid-cols-2 rounded-[8px] bg-[#F7F7F7] p-1 h-11">
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-2 rounded-[6px] data-[state=active]:bg-white data-[state=active]:shadow-sm h-full text-sm font-medium"
                >
                  <ClipboardList className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="clinical-record"
                  className="flex items-center gap-2 rounded-[6px] data-[state=active]:bg-white data-[state=active]:shadow-sm h-full text-sm font-medium"
                >
                  <FileText className="h-4 w-4" />
                  Clinical Record
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <TabsContent
                value="details"
                className="h-full overflow-y-auto m-0 px-4 sm:px-6 py-4 sm:py-5 focus-visible:outline-none"
              >
                <ConsultationDetailsSummary
                  consultation={consultation}
                  historyDoctor={doctor}
                  scheduledDate={scheduledDate}
                  scheduledTime={scheduledTime}
                  typeLabel={typeConfig.label}
                  TypeIcon={TypeIcon}
                />
              </TabsContent>

              <TabsContent
                value="clinical-record"
                className="h-full overflow-hidden m-0 focus-visible:outline-none"
              >
                {consultationId && (
                  <div className="h-full min-h-0">
                    <ConsultationPreview
                      consultationId={consultationId}
                      mode="preview"
                    />
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
