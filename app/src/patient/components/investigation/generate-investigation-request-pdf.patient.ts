import jsPDF from "jspdf";
import { formatUtcDate } from "@/lib/utils";
import { getInvestigationDisplayFields } from "@/shared/utils/investigation-display.util";
import {
  InvestigationGroup,
  InvestigationPatientProfile,
} from "./investigation.types.patient";

const drawCrossIcon = (doc: jsPDF, cx: number, cy: number, size: number) => {
  const half = size / 2;
  const thickness = size / 3.5;
  doc.setFillColor(0, 153, 204);
  doc.rect(cx - thickness / 2, cy - half, thickness, size, "F");
  doc.rect(cx - half, cy - thickness / 2, size, thickness, "F");
  doc.setFillColor(30, 120, 180);
  doc.rect(cx - half, cy - half, half, thickness / 2, "F");
};

export const generateInvestigationRequestPdf = (
  group: InvestigationGroup,
  profile?: InvestigationPatientProfile,
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 30;
  const marginRight = 30;
  const contentWidth = pageWidth - marginLeft - marginRight;

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
  doc.text("MEDICAL INVESTIGATION SHEET", pageWidth / 2, titleY + 8, {
    align: "center",
  });

  doc.line(marginLeft, titleY + 12, pageWidth - marginRight, titleY + 12);

  const name = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : "N/A";

  let age = "N/A";
  if (profile?.date_of_birth) {
    const diff =
      new Date().getTime() - new Date(profile.date_of_birth).getTime();
    age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)).toString();
  }

  const consId = group.consultation?._id || "N/A";
  const consRefDisplay =
    consId !== "N/A" ? `C-${consId.slice(-6).toUpperCase()}` : "N/A";

  const scheduledStartAt =
    group.consultation?.appointment_id?.scheduled_start_at_utc;
  const dateSource = scheduledStartAt || new Date().toISOString();
  const date = formatUtcDate(dateSource, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = formatUtcDate(dateSource, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const doctor = group.consultation?.doctor_id;
  const docName = doctor
    ? `Dr. ${doctor.first_name || ""} ${doctor.last_name || ""}`.trim()
    : "N/A";

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
  cursorY += 10;

  // Render a compact table inspired by the Investigation Request Form columns
  // (Fasting column removed per latest requirements)
  const investigations = group.investigations || [];

  const colWidths = {
    test: contentWidth * 0.42,
    specimen: contentWidth * 0.3,
    priority: contentWidth * 0.28,
  };

  // Table header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 100);
  let x = marginLeft;
  doc.text("TEST (CATEGORY)", x, cursorY);
  x += colWidths.test;
  doc.text("SPECIMEN", x, cursorY);
  x += colWidths.specimen;
  doc.text("PRIORITY", x, cursorY);
  cursorY += 5;

  // Light header line
  doc.setDrawColor(180, 190, 200);
  doc.setLineWidth(0.25);
  doc.line(marginLeft, cursorY, marginLeft + contentWidth, cursorY);
  cursorY += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 50, 60);

  investigations.forEach((inv, idx) => {
    const { category, test_requested, specimen, priority } =
      getInvestigationDisplayFields(inv);
    const main =
      category && category !== "Other"
        ? `${test_requested} (${category})`
        : test_requested;

    // Alternate row background (subtle)
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginLeft, cursorY - 3.5, contentWidth, 6, "F");
    }

    let x = marginLeft;
    const mainLines = doc.splitTextToSize(main, colWidths.test - 2);
    doc.text(mainLines, x, cursorY);
    const rowHeight = Math.max(4.5, mainLines.length * 4.2);

    x += colWidths.test;
    doc.text(specimen || "-", x, cursorY);

    x += colWidths.specimen;
    // Color the priority
    if (priority.toLowerCase() === "stat") doc.setTextColor(180, 40, 40);
    else if (priority.toLowerCase() === "urgent")
      doc.setTextColor(180, 120, 30);
    else doc.setTextColor(40, 50, 60);
    doc.text(priority || "Routine", x, cursorY);
    doc.setTextColor(40, 50, 60);

    cursorY += rowHeight + 1.5;
  });

  cursorY += 4;

  const closingText1 =
    "Please complete these investigations as soon as possible and ensure to upload the results to our portal at your earliest convenience.";
  const closing1Lines = doc.splitTextToSize(closingText1, contentWidth);
  doc.text(closing1Lines, marginLeft, cursorY);
  cursorY += closing1Lines.length * 5.5 + 6;

  doc.text(
    "Thank you for your prompt attention to this matter.",
    marginLeft,
    cursorY,
  );
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

  doc.save(`investigation-request-${consId}.pdf`);
};
