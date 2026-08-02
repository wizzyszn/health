import jsPDF from "jspdf";
import { formatUtcDate } from "@/lib/utils";
import type { ReferralGroup } from "@/patient/components/referral/referral.types.patient";

export interface ReferralPdfPatientProfile {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
}

export interface ReferralPdfDoctor {
  full_name?: string;
  specializations?: string[];
}

export interface ReferralPdfConsultation {
  _id?: string;
  title?: string;
  appointment_id?: { scheduled_start_at_utc?: string } | null;
}

export interface ReferralPdfItem {
  _id: string;
  specialist_name: string;
  hospital: string;
  referral_details: string;
  referred_doctor_name?: string | null;
  createdAt?: string;
  doctor_id?: ReferralPdfDoctor | null;
  consultation_id?: ReferralPdfConsultation | string;
}

const drawCrossIcon = (doc: jsPDF, cx: number, cy: number, size: number) => {
  const half = size / 2;
  const thickness = size / 3.5;
  doc.setFillColor(0, 153, 204);
  doc.rect(cx - thickness / 2, cy - half, thickness, size, "F");
  doc.rect(cx - half, cy - thickness / 2, size, thickness, "F");
  doc.setFillColor(30, 120, 180);
  doc.rect(cx - half, cy - half, half, thickness / 2, "F");
};

function drawMediappHeader(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 30;
  const marginRight = 30;

  const logoSize = 14;
  const logoX = pageWidth / 2 - 18;
  const logoY = 18;
  drawCrossIcon(doc, logoX, logoY, logoSize);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 60, 120);
  doc.text("MEDIAPP", logoX + logoSize / 2 + 5, logoY + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 140, 160);
  doc.text(
    "Comprehensive Healthcare Solutions",
    logoX + logoSize / 2 + 5,
    logoY + 7,
  );

  const titleY = 38;
  doc.setDrawColor(180, 190, 200);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, titleY, pageWidth - marginRight, titleY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 40, 60);
  doc.text(title, pageWidth / 2, titleY + 8, { align: "center" });
  doc.line(marginLeft, titleY + 12, pageWidth - marginRight, titleY + 12);

  return titleY;
}

function getPatientAge(profile?: ReferralPdfPatientProfile) {
  if (!profile?.date_of_birth) return "N/A";
  const diff = new Date().getTime() - new Date(profile.date_of_birth).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)).toString();
}

function getDoctorName(doctor?: ReferralPdfDoctor | null, fallback = "N/A") {
  if (!doctor?.full_name) return fallback;
  return doctor.full_name.startsWith("Dr.")
    ? doctor.full_name
    : `Dr. ${doctor.full_name}`;
}

function getConsultationContext(
  referral: ReferralPdfItem,
  group?: ReferralGroup,
) {
  const consultation =
    typeof referral.consultation_id === "object"
      ? referral.consultation_id
      : group?.consultation;

  const consultationId =
    (typeof consultation === "object" && consultation?._id) ||
    (typeof referral.consultation_id === "string"
      ? referral.consultation_id
      : group?.consultation?._id) ||
    "N/A";

  const scheduledStartAt =
    typeof consultation === "object" &&
    consultation &&
    "appointment_id" in consultation &&
    consultation.appointment_id
      ? consultation.appointment_id.scheduled_start_at_utc
      : undefined;

  const dateSource =
    scheduledStartAt || referral.createdAt || new Date().toISOString();

  return {
    consultationId,
    consultationTitle:
      (typeof consultation === "object" && consultation?.title) ||
      group?.consultation?.title ||
      "Consultation",
    date: formatUtcDate(dateSource, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: formatUtcDate(dateSource, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function drawReferralLetterBody(
  doc: jsPDF,
  referral: ReferralPdfItem,
  profile: ReferralPdfPatientProfile | undefined,
  group: ReferralGroup | undefined,
  startY: number,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 30;
  const marginRight = 30;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const lineHeight = 7;

  const patientName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : "N/A";
  const age = getPatientAge(profile);
  const context = getConsultationContext(referral, group);
  const consRefDisplay =
    context.consultationId !== "N/A"
      ? `C-${context.consultationId.slice(-6).toUpperCase()}`
      : "N/A";
  const doctorName = getDoctorName(referral.doctor_id);

  const infoStartY = startY + 20;
  const leftX = marginLeft;
  const rightX = pageWidth / 2 + 10;

  doc.setFontSize(10);
  doc.setTextColor(20, 40, 60);

  doc.setFont("helvetica", "bold");
  doc.text("Patient Name:", leftX, infoStartY);
  doc.setFont("helvetica", "normal");
  doc.text(
    ` ${patientName}`,
    leftX + doc.getTextWidth("Patient Name:"),
    infoStartY,
  );

  doc.setFont("helvetica", "bold");
  doc.text("Age:", leftX, infoStartY + lineHeight);
  doc.setFont("helvetica", "normal");
  doc.text(
    ` ${age}`,
    leftX + doc.getTextWidth("Age:"),
    infoStartY + lineHeight,
  );

  doc.setFont("helvetica", "bold");
  doc.text("Consultation Ref No:", leftX, infoStartY + lineHeight * 2);
  doc.setFont("helvetica", "normal");
  doc.text(
    ` ${consRefDisplay}`,
    leftX + doc.getTextWidth("Consultation Ref No:"),
    infoStartY + lineHeight * 2,
  );

  doc.setFont("helvetica", "bold");
  doc.text("Date:", rightX, infoStartY);
  doc.setFont("helvetica", "normal");
  doc.text(`  ${context.date}`, rightX + doc.getTextWidth("Date:"), infoStartY);

  doc.setFont("helvetica", "bold");
  doc.text("Time:", rightX, infoStartY + lineHeight);
  doc.setFont("helvetica", "normal");
  doc.text(
    `  ${context.time}`,
    rightX + doc.getTextWidth("Time:"),
    infoStartY + lineHeight,
  );

  doc.setFont("helvetica", "bold");
  doc.text("Referring Doctor:", rightX, infoStartY + lineHeight * 2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 100, 160);
  doc.text(doctorName, rightX, infoStartY + lineHeight * 3);
  doc.setTextColor(20, 40, 60);

  let cursorY = infoStartY + lineHeight * 4 + 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 80);
  doc.text(`Dear ${patientName},`, marginLeft, cursorY);
  cursorY += 10;

  doc.setFontSize(10);
  doc.setTextColor(40, 50, 60);
  const introText =
    "Following our consultation, please find below the details of your specialist referral:";
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, marginLeft, cursorY);
  cursorY += introLines.length * 5.5 + 8;

  const detailRows: Array<[string, string]> = [
    ["Specialist", referral.specialist_name],
    ["Hospital / Clinic", referral.hospital],
  ];

  if (referral.referred_doctor_name) {
    detailRows.push(["Referred Doctor", referral.referred_doctor_name]);
  }

  detailRows.push(["Consultation", context.consultationTitle]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 80);
  doc.text("Referral Details:", marginLeft, cursorY);
  const headerWidth = doc.getTextWidth("Referral Details:");
  doc.setDrawColor(20, 50, 80);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, cursorY + 1, marginLeft + headerWidth, cursorY + 1);
  cursorY += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  detailRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 90, 100);
    doc.text(`${label}:`, marginLeft, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 50, 60);
    const valueLines = doc.splitTextToSize(value || "N/A", contentWidth - 42);
    doc.text(valueLines, marginLeft + 40, cursorY);
    cursorY += Math.max(6, valueLines.length * 5.5) + 2;
  });

  cursorY += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 80);
  doc.text("Clinical Summary / Reason for Referral:", marginLeft, cursorY);
  const summaryWidth = doc.getTextWidth(
    "Clinical Summary / Reason for Referral:",
  );
  doc.line(marginLeft, cursorY + 1, marginLeft + summaryWidth, cursorY + 1);
  cursorY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 50, 60);
  const summaryLines = doc.splitTextToSize(
    referral.referral_details || "N/A",
    contentWidth,
  );
  doc.text(summaryLines, marginLeft, cursorY);
  cursorY += summaryLines.length * 5.5 + 10;

  const closingText =
    "Please attend the referred specialist at your earliest convenience and share any investigation results through your patient portal.";
  const closingLines = doc.splitTextToSize(closingText, contentWidth);
  doc.text(closingLines, marginLeft, cursorY);
  cursorY += closingLines.length * 5.5 + 12;

  doc.text("Kind regards,", marginLeft, cursorY);
  cursorY += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 40, 60);
  doc.text(doctorName, marginLeft, cursorY);
  cursorY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 90, 100);
  doc.text("Referring Physician", marginLeft, cursorY);
  cursorY += 5;

  if (referral.doctor_id?.specializations?.length) {
    doc.text(
      referral.doctor_id.specializations.join(", "),
      marginLeft,
      cursorY,
    );
    cursorY += 5;
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 60, 120);
  doc.text("MEDIAPP", marginLeft, cursorY);

  return cursorY + 12;
}

export function generateReferralLetterPdf(
  referral: ReferralPdfItem,
  profile?: ReferralPdfPatientProfile,
  group?: ReferralGroup,
) {
  const doc = new jsPDF();
  const titleY = drawMediappHeader(doc, "MEDICAL REFERRAL LETTER");
  drawReferralLetterBody(doc, referral, profile, group, titleY);

  const refSuffix = referral._id.slice(-6).toUpperCase();
  doc.save(`referral-letter-${refSuffix}.pdf`);
}

export function generateReferralGroupPdf(
  group: ReferralGroup,
  profile?: ReferralPdfPatientProfile,
) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginBottom = 30;
  let titleY = drawMediappHeader(doc, "MEDICAL REFERRAL LETTERS");
  let cursorY = titleY;

  const referrals: ReferralPdfItem[] = (group.referrals || []).map(
    (referral) => ({
      _id: referral._id,
      specialist_name: referral.specialist_name,
      hospital: referral.hospital,
      referral_details: referral.referral_details,
      referred_doctor_name: referral.referred_doctor_name,
      createdAt: referral.createdAt,
      doctor_id: referral.doctor_id,
      consultation_id: referral.consultation_id,
    }),
  );

  referrals.forEach((referral, index) => {
    if (index > 0) {
      cursorY += 8;
      if (cursorY > pageHeight - marginBottom) {
        doc.addPage();
        titleY = drawMediappHeader(doc, "MEDICAL REFERRAL LETTERS");
        cursorY = titleY;
      } else {
        doc.setDrawColor(210, 215, 225);
        doc.setLineWidth(0.4);
        doc.line(30, cursorY, doc.internal.pageSize.getWidth() - 30, cursorY);
        cursorY += 10;
      }
    }

    const endY = drawReferralLetterBody(doc, referral, profile, group, cursorY);

    if (endY > pageHeight - marginBottom && index < referrals.length - 1) {
      doc.addPage();
      titleY = drawMediappHeader(doc, "MEDICAL REFERRAL LETTERS");
      cursorY = titleY;
    } else {
      cursorY = endY;
    }
  });

  const consultationId = group.consultation?._id || "consultation";
  doc.save(`referral-letters-${consultationId.slice(-6).toUpperCase()}.pdf`);
}
