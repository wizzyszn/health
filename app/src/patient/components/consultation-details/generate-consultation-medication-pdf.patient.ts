import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

export function generateConsultationMedicationPdf(
  consultationId: string,
  med: GroupedMedicationItem,
  consultation: ConsultationInfo,
  profile?: PatientProfile | null,
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;

  const drawCrossIcon = (cx: number, cy: number, size: number) => {
    const half = size / 2;
    const thickness = size / 3.5;
    doc.setFillColor(0, 153, 204);
    doc.rect(cx - thickness / 2, cy - half, thickness, size, "F");
    doc.rect(cx - half, cy - thickness / 2, size, thickness, "F");
    doc.setFillColor(30, 120, 180);
    doc.rect(cx - half, cy - half, half, thickness / 2, "F");
  };

  const logoSize = 14;
  const logoX = pageWidth / 2 - 18;
  const logoY = 18;
  drawCrossIcon(logoX, logoY, logoSize);

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
  doc.setFontSize(14);
  doc.setTextColor(20, 40, 60);
  doc.text("PRESCRIPTION SHEET", pageWidth / 2, titleY + 8, {
    align: "center",
  });
  doc.line(marginLeft, titleY + 12, pageWidth - marginRight, titleY + 12);

  const infoBoxY = titleY + 18;
  const infoBoxHeight = 45;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(210, 215, 225);
  doc.rect(
    marginLeft,
    infoBoxY,
    pageWidth - marginLeft - marginRight,
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
    docName = rawName.startsWith("Dr.") ? rawName : `Dr. ${rawName}`;
  }

  const leftX = marginLeft + 6;
  const rightX = pageWidth / 2 + 10;
  const lineHeight = 7;
  const infoTextY = infoBoxY + 10;

  doc.setFontSize(10);
  doc.setTextColor(20, 40, 60);

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

  const tableHeaderY = infoBoxY + infoBoxHeight + 10;
  doc.setFillColor(30, 58, 138);
  doc.rect(
    marginLeft,
    tableHeaderY,
    pageWidth - marginLeft - marginRight,
    8,
    "F",
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("MEDICATION TABLE", pageWidth / 2, tableHeaderY + 5.5, {
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
    margin: { left: marginLeft, right: marginRight },
    tableWidth: pageWidth - marginLeft - marginRight,
    headStyles: {
      fillColor: [239, 246, 255],
      textColor: [30, 58, 138],
      fontStyle: "bold",
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      textColor: [40, 50, 60],
    },
  });

  const tableEndY =
    (doc as unknown as JsPDFWithAutoTable).lastAutoTable.finalY + 12;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const afterOrderInstructionsY = drawMedicationOrderInstructionsSection(
    doc,
    marginLeft,
    contentWidth,
    tableEndY,
    [med],
  );
  const sigY = drawGeneralMedicationInstructionsSection(
    doc,
    marginLeft,
    contentWidth,
    afterOrderInstructionsY,
  );
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(210, 215, 225);
  doc.rect(marginLeft, sigY, contentWidth, 34, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138);
  doc.text("PRESCRIBED BY:", marginLeft + 6, sigY + 10);

  doc.setFontSize(13);
  doc.setTextColor(20, 40, 60);
  doc.text(docName, marginLeft + 6, sigY + 17);

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Responsible Prescriber", marginLeft + 6, sigY + 23);

  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.text("MEDIAPP", marginLeft + 6, sigY + 29);

  doc.setTextColor(20, 40, 60);
  doc.setFontSize(10);
  doc.text(`Ref: ${consRefDisplay}`, pageWidth - marginRight - 6, sigY + 29, {
    align: "right",
  });

  doc.setDrawColor(210, 215, 225);
  doc.line(marginLeft, 282, pageWidth - marginRight, 282);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Official use only. For stock supplies and out-patient prescriptions in hospital. May also be used for primary care.",
    marginLeft,
    287,
  );

  doc.save(`${med.medication}_prescription.pdf`);
}
