import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  COMPANY,
  REFERRAL_PALETTE,
} from "@/shared/constants/company.constants";
import {
  loadLogoDataUrl,
  drawFooterWave,
  drawHeader,
  setText,
  setFill,
  MARGIN,
  PAGE_W,
} from "@/shared/utils/pdf-branding.util";
import { formatUtcDate } from "@/lib/utils";
import {
  drawGeneralMedicationInstructionsSection,
  drawMedicationOrderInstructionsSection,
  formatMedicationStartDate,
} from "@/patient/components/medication/medication-pdf-instructions.util.patient";
import type {
  GroupedMedicationItem,
  JsPDFWithAutoTable,
} from "./consultation-detail.types.patient";

interface PatientProfile {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
}

interface ConsultationInfo {
  appointment_id?: {
    scheduled_start_at_utc?: string;
    appointment_number?: string;
  } | null;
  doctor_id?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
  } | null;
}

export async function generateConsultationMedicationPdf(
  consultationId: string,
  med: GroupedMedicationItem,
  consultation: ConsultationInfo,
  profile?: PatientProfile | null,
) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginRight = 20;

  const headerEnd = drawHeader(doc, logoDataUrl);

  // Title
  let cursorY = headerEnd + 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setText(doc, REFERRAL_PALETTE.primary);
  doc.text("PRESCRIPTION SHEET", PAGE_W / 2, cursorY, { align: "center" });
  cursorY += 10;

  // Patient Info Box
  const infoBoxY = cursorY;
  const infoBoxHeight = 45;
  setFill(doc, REFERRAL_PALETTE.gridFill);
  doc.setDrawColor(210, 215, 225);
  doc.rect(
    MARGIN,
    infoBoxY,
    pageWidth - MARGIN - marginRight,
    infoBoxHeight,
    "FD",
  );

  const name = profile?.first_name
    ? `${profile.first_name} ${profile.last_name}`
    : "N/A";

  let dob = "N/A";
  if (profile?.date_of_birth) {
    dob = formatUtcDate(profile.date_of_birth, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const consId = consultationId || "N/A";
  const consRefDisplay =
    consId !== "N/A" ? `C-${consId.slice(-6).toUpperCase()}` : "N/A";

  const medDateTime =
    consultation.appointment_id?.scheduled_start_at_utc ||
    new Date().toISOString();
  const date = formatUtcDate(medDateTime, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = formatUtcDate(medDateTime, {
    hour: "2-digit",
    minute: "2-digit",
  });

  let docName = "N/A";
  if (consultation.doctor_id) {
    const rawName =
      consultation.doctor_id.full_name ||
      `${consultation.doctor_id.first_name} ${consultation.doctor_id.last_name}`;
    docName =
      rawName.startsWith("Dr.") || rawName.startsWith("Dr ")
        ? rawName.replace(/^Dr\.?\s*/, "Dr ")
        : `Dr ${rawName}`;
  }

  const leftX = MARGIN + 6;
  const rightX = pageWidth / 2 + 10;
  const lineHeight = 7;
  const infoTextY = infoBoxY + 10;

  doc.setFontSize(10);
  setText(doc, REFERRAL_PALETTE.ink);

  doc.setFont("helvetica", "bold");
  doc.text("Patient Name: ", leftX, infoTextY);
  doc.setFont("helvetica", "normal");
  doc.text(name, leftX + doc.getTextWidth("Patient Name: "), infoTextY);

  doc.setFont("helvetica", "bold");
  doc.text("DOB: ", leftX, infoTextY + lineHeight);
  doc.setFont("helvetica", "normal");
  doc.text(dob, leftX + doc.getTextWidth("DOB: "), infoTextY + lineHeight);

  doc.setFont("helvetica", "bold");
  doc.text("Consultation Ref: ", leftX, infoTextY + lineHeight * 2);
  doc.setFont("helvetica", "normal");
  doc.text(
    consRefDisplay,
    leftX + doc.getTextWidth("Consultation Ref: "),
    infoTextY + lineHeight * 2,
  );

  doc.setFont("helvetica", "bold");
  doc.text("Date:  ", rightX, infoTextY);
  doc.setFont("helvetica", "normal");
  doc.text(date, rightX + doc.getTextWidth("Date:  "), infoTextY);

  doc.setFont("helvetica", "bold");
  doc.text("Time:  ", rightX, infoTextY + lineHeight);
  doc.setFont("helvetica", "normal");
  doc.text(time, rightX + doc.getTextWidth("Time:  "), infoTextY + lineHeight);

  doc.setFont("helvetica", "bold");
  doc.text("Prescriber:", rightX, infoTextY + lineHeight * 2);
  doc.setFont("helvetica", "normal");
  doc.text(docName, rightX, infoTextY + lineHeight * 3);

  // Medication Table
  const tableHeaderY = infoBoxY + infoBoxHeight + 10;
  doc.setFillColor(30, 58, 138);
  doc.rect(MARGIN, tableHeaderY, pageWidth - MARGIN - marginRight, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("MEDICATION TABLE", PAGE_W / 2, tableHeaderY + 5.5, {
    align: "center",
  });

  autoTable(doc, {
    startY: tableHeaderY + 8,
    head: [["Drug", "Dosage", "Frequency", "Duration", "Start Date"]],
    body: [
      [
        med.medication || "N/A",
        `${med.dose} ${med.unit}`,
        med.interval || "N/A",
        `${med.duration} ${med.duration_unit}`,
        formatMedicationStartDate(med.start_date),
      ],
    ],
    theme: "grid",
    margin: { left: MARGIN, right: marginRight },
    tableWidth: pageWidth - MARGIN - marginRight,
    headStyles: {
      fillColor: REFERRAL_PALETTE.gridFill,
      textColor: REFERRAL_PALETTE.primary,
      fontStyle: "bold",
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      textColor: REFERRAL_PALETTE.ink,
    },
  });

  const tableEndY =
    (doc as unknown as JsPDFWithAutoTable).lastAutoTable.finalY + 12;
  const contentWidth = pageWidth - MARGIN - marginRight;

  const afterOrderInstructionsY = drawMedicationOrderInstructionsSection(
    doc,
    MARGIN,
    contentWidth,
    tableEndY,
    [med],
  );
  const sigY = drawGeneralMedicationInstructionsSection(
    doc,
    MARGIN,
    contentWidth,
    afterOrderInstructionsY,
  );

  // Prescriber block
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(210, 215, 225);
  doc.rect(MARGIN, sigY, contentWidth, 34, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setText(doc, REFERRAL_PALETTE.primary);
  doc.text("PRESCRIBED BY:", MARGIN + 6, sigY + 10);

  doc.setFontSize(13);
  setText(doc, REFERRAL_PALETTE.ink);
  doc.text(docName, MARGIN + 6, sigY + 17);

  setText(doc, REFERRAL_PALETTE.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Responsible Prescriber", MARGIN + 6, sigY + 23);

  setText(doc, REFERRAL_PALETTE.primary);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, MARGIN + 6, sigY + 29);

  setText(doc, REFERRAL_PALETTE.ink);
  doc.setFontSize(10);
  doc.text(`Ref: ${consRefDisplay}`, pageWidth - marginRight - 6, sigY + 29, {
    align: "right",
  });

  drawFooterWave(doc);

  doc.save(`${med.medication}_prescription.pdf`);
}
