import jsPDF from "jspdf";
import { formatUtcDate } from "@/lib/utils";
import {
  formatInvestigationLabel,
  getInvestigationDisplayFields,
} from "@/shared/utils/investigation-display.util";
import type {
  InvestigationItem,
  JsPDFWithAutoTable,
} from "./consultation-detail.types.patient";

interface PatientProfile {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
}

interface ConsultationSummary {
  _id?: string;
  doctor_id?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
  } | null;
  appointment_id?: { scheduled_start_at_utc?: string } | null;
}

export function generateConsultationInvestigationPdf(
  consultationId: string,
  investigationItems: InvestigationItem[],
  consultationSummary: ConsultationSummary,
  profile?: PatientProfile | null,
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 30;
  const marginRight = 30;
  const contentWidth = pageWidth - marginLeft - marginRight;

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
  doc.setFontSize(13);
  doc.setTextColor(20, 40, 60);
  doc.text("MEDICAL INVESTIGATION SHEET", pageWidth / 2, titleY + 8, {
    align: "center",
  });
  doc.line(marginLeft, titleY + 12, pageWidth - marginRight, titleY + 12);

  const name = profile?.first_name
    ? `${profile.first_name} ${profile.last_name}`
    : "N/A";

  let age = "N/A";
  if (profile?.date_of_birth) {
    const diff =
      new Date().getTime() - new Date(profile.date_of_birth).getTime();
    age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)).toString();
  }

  const consId = consultationSummary?._id || consultationId || "N/A";
  const consRefDisplay =
    consId !== "N/A" ? `C-${consId.slice(-6).toUpperCase()}` : "N/A";

  const scheduledStartAt = "";
  const date = scheduledStartAt
    ? formatUtcDate(scheduledStartAt, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : formatUtcDate(new Date().toISOString(), {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
  const time = scheduledStartAt
    ? formatUtcDate(scheduledStartAt, { hour: "2-digit", minute: "2-digit" })
    : formatUtcDate(new Date().toISOString(), {
        hour: "2-digit",
        minute: "2-digit",
      });

  const docName = "N/A";

  const infoStartY = titleY + 20;
  const leftX = marginLeft;
  const rightX = pageWidth / 2 + 10;
  const lineHeight = 7;

  doc.setFontSize(10);
  doc.setTextColor(20, 40, 60);

  doc.setFont("helvetica", "bold");
  doc.text("Patient Name:", leftX, infoStartY);
  doc.setFont("helvetica", "normal");
  doc.text(` ${name}`, leftX + doc.getTextWidth("Patient Name:"), infoStartY);

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
  doc.text(`  ${date}`, rightX + doc.getTextWidth("Date:"), infoStartY);

  doc.setFont("helvetica", "bold");
  doc.text("Time:", rightX, infoStartY + lineHeight);
  doc.setFont("helvetica", "normal");
  doc.text(
    `  ${time}`,
    rightX + doc.getTextWidth("Time:"),
    infoStartY + lineHeight,
  );

  doc.setFont("helvetica", "bold");
  doc.text("Requesting Doctor:", rightX, infoStartY + lineHeight * 2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 100, 160);
  doc.text(docName, rightX, infoStartY + lineHeight * 3);
  doc.setTextColor(20, 40, 60);

  let cursorY = infoStartY + lineHeight * 4 + 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 80);
  doc.text(`Dear ${name},`, marginLeft, cursorY);
  cursorY += 10;

  doc.setFontSize(10);
  doc.setTextColor(40, 50, 60);
  const introText =
    "Following our consultation today, here is a summary of the investigations we have requested for you:";
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, marginLeft, cursorY);
  cursorY += introLines.length * 5.5 + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 80);
  doc.text("Summary of Consultation:", marginLeft, cursorY);
  const summaryHeaderWidth = doc.getTextWidth("Summary of Consultation:");
  doc.setDrawColor(20, 50, 80);
  doc.setLineWidth(0.3);
  doc.line(
    marginLeft,
    cursorY + 1,
    marginLeft + summaryHeaderWidth,
    cursorY + 1,
  );
  cursorY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 50, 60);

  const consultationSummaryItems = [
    "Patient consultation completed successfully.",
    "Investigations requested based on clinical assessment.",
    "Results to be reviewed upon completion.",
  ];

  consultationSummaryItems.forEach((item) => {
    doc.text("•", marginLeft + 4, cursorY);
    const bulletLines = doc.splitTextToSize(item, contentWidth - 12);
    doc.text(bulletLines, marginLeft + 10, cursorY);
    cursorY += bulletLines.length * 5.5 + 2;
  });
  cursorY += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 80);
  doc.text("Investigations Requested:", marginLeft, cursorY);
  const invHeaderWidth = doc.getTextWidth("Investigations Requested:");
  doc.setDrawColor(20, 50, 80);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, cursorY + 1, marginLeft + invHeaderWidth, cursorY + 1);
  cursorY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 50, 60);

  investigationItems.forEach((inv) => {
    const { priority, specimen } = getInvestigationDisplayFields(inv);
    const label = formatInvestigationLabel(inv);
    const details = [
      label,
      specimen && specimen !== "-" ? `Specimen: ${specimen}` : "",
      priority ? `Priority: ${priority}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    doc.text("•", marginLeft + 4, cursorY);
    const invLines = doc.splitTextToSize(details, contentWidth - 12);
    doc.text(invLines, marginLeft + 10, cursorY);
    cursorY += invLines.length * 5.5 + 2;
  });
  cursorY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 50, 60);

  const closingText1 =
    "Please complete these investigations as soon as possible and ensure to upload the results to our portal at your earliest convenience.";
  const closing1Lines = doc.splitTextToSize(closingText1, contentWidth);
  doc.text(closing1Lines, marginLeft, cursorY);
  cursorY += closing1Lines.length * 5.5 + 6;

  const closingText2 = "Thank you for your prompt attention to this matter.";
  doc.text(closingText2, marginLeft, cursorY);
  cursorY += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 50, 60);
  doc.text("Kind regards,", marginLeft, cursorY);
  cursorY += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 40, 60);
  doc.text(docName, marginLeft, cursorY);
  cursorY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 90, 100);
  doc.text("Requesting Physician", marginLeft, cursorY);
  cursorY += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 60, 120);
  doc.text("MEDIAPP", marginLeft, cursorY);

  void (doc as unknown as JsPDFWithAutoTable);

  doc.save(`investigation-request-${consId}.pdf`);
}
