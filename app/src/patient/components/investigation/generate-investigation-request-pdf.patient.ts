import jsPDF from "jspdf";
import { REFERRAL_PALETTE } from "@/shared/constants/company.constants";
import {
  loadLogoDataUrl,
  drawFooterWave,
  drawHeader,
  drawSignatureBlock,
  setText,
  setDraw,
  MARGIN,
  PAGE_W,
} from "@/shared/utils/pdf-branding.util";
import { formatUtcDate } from "@/lib/utils";
import { getInvestigationDisplayFields } from "@/shared/utils/investigation-display.util";
import {
  InvestigationGroup,
  InvestigationPatientProfile,
} from "./investigation.types.patient";

export const generateInvestigationRequestPdf = async (
  group: InvestigationGroup,
  profile?: InvestigationPatientProfile,
) => {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginRight = 30;
  const contentWidth = pageWidth - MARGIN - marginRight;

  const headerEnd = drawHeader(doc, logoDataUrl);

  // Title
  let cursorY = headerEnd + 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setText(doc, REFERRAL_PALETTE.ink);
  doc.text("MEDICAL INVESTIGATION SHEET", PAGE_W / 2, cursorY, {
    align: "center",
  });
  cursorY += 10;

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
    ? `Dr ${doctor.first_name || ""} ${doctor.last_name || ""}`.trim()
    : "N/A";

  const infoStartY = cursorY;
  const leftX = MARGIN;
  const rightX = pageWidth / 2 + 10;
  const lineHeight = 7;

  doc.setFontSize(10);
  setText(doc, REFERRAL_PALETTE.ink);

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
  setText(doc, REFERRAL_PALETTE.accent);
  doc.text(docName, rightX, infoStartY + lineHeight * 3);
  setText(doc, REFERRAL_PALETTE.ink);

  cursorY = infoStartY + lineHeight * 4 + 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setText(doc, REFERRAL_PALETTE.ink);
  doc.text(`Dear ${name},`, MARGIN, cursorY);
  cursorY += 10;

  doc.setFontSize(10);
  const introText =
    "Following our consultation today, here is a summary of the investigations we have requested for you:";
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, MARGIN, cursorY);
  cursorY += introLines.length * 5.5 + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, REFERRAL_PALETTE.primary);
  doc.text("Summary of Consultation:", MARGIN, cursorY);
  const summaryHeaderWidth = doc.getTextWidth("Summary of Consultation:");
  setDraw(doc, REFERRAL_PALETTE.primary);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, cursorY + 1, MARGIN + summaryHeaderWidth, cursorY + 1);
  cursorY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText(doc, REFERRAL_PALETTE.ink);
  const consultationSummaryItems = [
    "Patient consultation completed successfully.",
    "Investigations requested based on clinical assessment.",
    "Results to be reviewed upon completion.",
  ];

  consultationSummaryItems.forEach((item) => {
    doc.text("•", MARGIN + 4, cursorY);
    const bulletLines = doc.splitTextToSize(item, contentWidth - 12);
    doc.text(bulletLines, MARGIN + 10, cursorY);
    cursorY += bulletLines.length * 5.5 + 2;
  });
  cursorY += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, REFERRAL_PALETTE.primary);
  doc.text("Investigations Requested:", MARGIN, cursorY);
  const invHeaderWidth = doc.getTextWidth("Investigations Requested:");
  setDraw(doc, REFERRAL_PALETTE.primary);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, cursorY + 1, MARGIN + invHeaderWidth, cursorY + 1);
  cursorY += 10;

  // Investigation table
  const investigations = group.investigations || [];

  const colWidths = {
    test: contentWidth * 0.42,
    specimen: contentWidth * 0.3,
    priority: contentWidth * 0.28,
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, REFERRAL_PALETTE.muted);
  let x = MARGIN;
  doc.text("TEST (CATEGORY)", x, cursorY);
  x += colWidths.test;
  doc.text("SPECIMEN", x, cursorY);
  x += colWidths.specimen;
  doc.text("PRIORITY", x, cursorY);
  cursorY += 5;

  setDraw(doc, REFERRAL_PALETTE.rule);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, cursorY, MARGIN + contentWidth, cursorY);
  cursorY += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(doc, REFERRAL_PALETTE.ink);

  investigations.forEach((inv, idx) => {
    const { category, test_requested, specimen, priority } =
      getInvestigationDisplayFields(inv);
    const main =
      category && category !== "Other"
        ? `${test_requested} (${category})`
        : test_requested;

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(MARGIN, cursorY - 3.5, contentWidth, 6, "F");
    }

    let x = MARGIN;
    const mainLines = doc.splitTextToSize(main, colWidths.test - 2);
    doc.text(mainLines, x, cursorY);
    const rowHeight = Math.max(4.5, mainLines.length * 4.2);

    x += colWidths.test;
    doc.text(specimen || "-", x, cursorY);

    x += colWidths.specimen;
    if (priority.toLowerCase() === "stat") setText(doc, [180, 40, 40] as const);
    else if (priority.toLowerCase() === "urgent")
      setText(doc, [180, 120, 30] as const);
    else setText(doc, REFERRAL_PALETTE.ink);
    doc.text(priority || "Routine", x, cursorY);
    setText(doc, REFERRAL_PALETTE.ink);

    cursorY += rowHeight + 1.5;
  });

  cursorY += 4;

  const closingText1 =
    "Please complete these investigations as soon as possible and ensure to upload the results to our portal at your earliest convenience.";
  const closing1Lines = doc.splitTextToSize(closingText1, contentWidth);
  doc.text(closing1Lines, MARGIN, cursorY);
  cursorY += closing1Lines.length * 5.5 + 6;

  doc.text(
    "Thank you for your prompt attention to this matter.",
    MARGIN,
    cursorY,
  );
  cursorY += 12;

  drawSignatureBlock(doc, docName, cursorY);
  drawFooterWave(doc);

  doc.save(`investigation-request-${consId}.pdf`);
};
