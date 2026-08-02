import jsPDF from "jspdf";
import { format, isValid, parse } from "date-fns";

export function formatMedicationStartDate(startDate?: string | null): string {
  if (!startDate?.trim()) return "N/A";

  const parsed = parse(startDate, "yyyy-MM-dd", new Date());
  if (!isValid(parsed)) return startDate;

  return format(parsed, "dd MMM yyyy");
}

export const GENERAL_MEDICATION_INSTRUCTIONS = [
  "Please ensure to purchase your medication immediately from the pharmacy.",
  "For your convenience, you can also request to have your medication delivered directly to you by using our app.",
  "The prescribed medications have been noted according to the allergy details you have provided. Please ensure your allergy information is kept up to date.",
  "If you develop any adverse reactions to any of the prescribed medications, kindly seek immediate medical attention at the nearest hospital and report the reaction to Mediapp as soon as possible when safe to do so.",
];

type MedicationOrderInstruction = {
  medication?: string;
  order_instruction?: string | null;
};

function drawSectionHeader(
  doc: jsPDF,
  marginLeft: number,
  y: number,
  title: string,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 40, 60);
  doc.text(title, marginLeft, y);
  const headerWidth = doc.getTextWidth(title);
  doc.setDrawColor(20, 40, 60);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, y + 1, marginLeft + headerWidth, y + 1);
}

function drawInstructionBox(
  doc: jsPDF,
  marginLeft: number,
  contentWidth: number,
  boxY: number,
  lines: string[],
): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 50, 60);

  let totalHeight = 8;
  const wrappedLines: string[][] = lines.map((line) =>
    doc.splitTextToSize(line, contentWidth - 16),
  );
  wrappedLines.forEach((lineGroup) => {
    totalHeight += lineGroup.length * 4.5 + 4;
  });

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(210, 215, 225);
  doc.rect(marginLeft, boxY, contentWidth, totalHeight, "FD");

  let cursorY = boxY + 6;
  wrappedLines.forEach((lineGroup, index) => {
    if (lines.length > 1) {
      doc.text("•", marginLeft + 5, cursorY);
      doc.text(lineGroup, marginLeft + 10, cursorY);
    } else {
      doc.text(lineGroup, marginLeft + 8, cursorY);
    }
    cursorY += lineGroup.length * 4.5 + 4;

    if (index < wrappedLines.length - 1) {
      cursorY += 1;
    }
  });

  return boxY + totalHeight;
}

export function drawMedicationOrderInstructionsSection(
  doc: jsPDF,
  marginLeft: number,
  contentWidth: number,
  startY: number,
  items: MedicationOrderInstruction[],
): number {
  const instructionLines = items
    .map((item) => {
      const instruction = item.order_instruction?.trim();
      if (!instruction) return null;

      const drugName = item.medication?.trim();
      return drugName ? `${drugName}: ${instruction}` : instruction;
    })
    .filter((line): line is string => Boolean(line));

  if (instructionLines.length === 0) {
    return startY;
  }

  drawSectionHeader(doc, marginLeft, startY, "Order Instruction:");
  const boxEndY = drawInstructionBox(
    doc,
    marginLeft,
    contentWidth,
    startY + 6,
    instructionLines,
  );

  return boxEndY + 12;
}

export function drawGeneralMedicationInstructionsSection(
  doc: jsPDF,
  marginLeft: number,
  contentWidth: number,
  startY: number,
): number {
  drawSectionHeader(doc, marginLeft, startY, "Other Instructions:");
  const boxEndY = drawInstructionBox(
    doc,
    marginLeft,
    contentWidth,
    startY + 6,
    GENERAL_MEDICATION_INSTRUCTIONS,
  );

  return boxEndY + 12;
}
