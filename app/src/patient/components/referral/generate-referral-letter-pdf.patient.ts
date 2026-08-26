import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { REFERRAL_PALETTE } from "@/shared/constants/company.constants";
import {
  loadLogoDataUrl,
  drawFooterWave,
  drawHeader,
  ensureSpace,
  sectionHeading,
  bodyText,
  drawSignatureBlock,
  setText,
  MARGIN,
  PAGE_W,
  PAGE_H,
  CONTENT_W,
  FOOTER_ZONE,
} from "@/shared/utils/pdf-branding.util";
import type {
  ReferralLetterData,
  ReferralLetterImage,
} from "@/patient/components/referral/referral-letter-data.types.patient";

export type {
  ReferralLetterData,
  ReferralLetterImage,
} from "@/patient/components/referral/referral-letter-data.types.patient";

const MAX_ATTACHMENT_PAGES = 20;

/* ─── letter sections ─── */

function greetingName(recipientName: string): string {
  // Use "Dr" without dot to match the Carelexa letter style
  if (recipientName.startsWith("Dr ") || recipientName.startsWith("Dr.")) {
    return recipientName.replace(/^Dr\.?\s*/, "Dr ");
  }
  return `Dr ${recipientName}`;
}

function patientAge(data: ReferralLetterData): string {
  if (data.patient.age) return data.patient.age;
  if (!data.patient.dateOfBirth) return "—";
  const diff = Date.now() - new Date(data.patient.dateOfBirth).getTime();
  if (!Number.isFinite(diff)) return "—";
  return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} yrs`;
}

function drawPatientGrid(
  doc: jsPDF,
  data: ReferralLetterData,
  cursorY: number,
): number {
  const dateOfReferral = doc.splitTextToSize(
    data.referralDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    60,
  )[0];
  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: REFERRAL_PALETTE.ink,
    },
    headStyles: {
      fillColor: REFERRAL_PALETTE.gridFill,
      textColor: REFERRAL_PALETTE.primary,
      fontStyle: "bold",
    },
    columnStyles: {
      0: {
        cellWidth: 26,
        fontStyle: "bold",
        fillColor: REFERRAL_PALETTE.gridFill,
      },
      2: {
        cellWidth: 26,
        fontStyle: "bold",
        fillColor: REFERRAL_PALETTE.gridFill,
      },
    },
    body: [
      [
        "Patient Name",
        data.patient.fullName,
        "Date of Referral",
        dateOfReferral,
      ],
      [
        "DOB",
        data.patient.dateOfBirth
          ? dateOfReferral &&
            new Date(data.patient.dateOfBirth).toLocaleDateString("en-GB")
          : "—",
        "Age",
        patientAge(data),
      ],
      [
        "Gender",
        data.patient.gender ?? "—",
        "Phone",
        data.patient.phone ?? "—",
      ],
      ["Email", data.patient.email ?? "—", "MRN", data.patient.mrn ?? "—"],
    ],
  });
  const table = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  return (table?.finalY ?? cursorY) + 8;
}

function drawRecipientBlock(
  doc: jsPDF,
  data: ReferralLetterData,
  cursorY: number,
): number {
  let y = ensureSpace(doc, cursorY, 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setText(doc, REFERRAL_PALETTE.ink);
  const lines = [
    data.recipient.name,
    ...(data.recipient.specialty ? [data.recipient.specialty] : []),
    data.recipient.hospital,
    ...data.recipient.addressLines,
  ];
  lines.forEach((line) => {
    doc.text(line, MARGIN, y);
    y += 5;
  });
  return y + 3;
}

function drawClinicalSections(
  doc: jsPDF,
  data: ReferralLetterData,
  cursorY: number,
): number {
  let y = sectionHeading(
    doc,
    "Provisional Diagnosis & Reason for Referral",
    cursorY,
  );
  y = bodyText(doc, data.clinical.summary, y);

  y = sectionHeading(doc, "Relevant Medical History", y);
  y = bodyText(
    doc,
    data.clinical.history.length
      ? data.clinical.history.join("; ")
      : "None reported.",
    y,
  );

  y = sectionHeading(doc, "Current Medications", y);
  y = bodyText(
    doc,
    data.clinical.medications.length
      ? data.clinical.medications.map((m) => `• ${m}`).join("\n")
      : "None recorded.",
    y,
  );

  y = sectionHeading(doc, "Allergies", y);
  y = bodyText(
    doc,
    data.clinical.allergies.length
      ? data.clinical.allergies.join(", ")
      : "No known drug allergies.",
    y,
  );
  return y;
}

function drawInvestigationsTable(
  doc: jsPDF,
  data: ReferralLetterData,
  cursorY: number,
): number {
  if (!data.investigations.length) return cursorY;
  const y = sectionHeading(doc, "Relevant Investigations", cursorY);
  ensureSpace(doc, y, 20);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    head: [["Investigation", "Result", "Date"]],
    headStyles: {
      fillColor: REFERRAL_PALETTE.primary,
      textColor: [255, 255, 255],
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: REFERRAL_PALETTE.ink,
    },
    body: data.investigations.map((item) => [
      item.name,
      item.result ?? "",
      item.date ?? "",
    ]),
  });
  const table = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  return (table?.finalY ?? y) + 8;
}

/* ─── attachment pages ─── */

async function fetchImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Referral letter: skipped attachment image (${url}).`, error);
    return null;
  }
}

async function appendAttachmentPages(
  doc: jsPDF,
  images: ReferralLetterImage[],
): Promise<void> {
  const selected = images.slice(0, MAX_ATTACHMENT_PAGES);
  if (images.length > MAX_ATTACHMENT_PAGES) {
    console.warn(
      `Referral letter: capped attachment pages at ${MAX_ATTACHMENT_PAGES} (${images.length} requested).`,
    );
  }
  for (const image of selected) {
    const dataUrl = await fetchImageDataUrl(image.url);
    if (!dataUrl) continue;
    try {
      doc.addPage();
      drawFooterWave(doc);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      setText(doc, REFERRAL_PALETTE.muted);
      doc.text(image.label, PAGE_W / 2, PAGE_H - FOOTER_ZONE, {
        align: "center",
      });
      const props = doc.getImageProperties(dataUrl);
      const boxW = CONTENT_W;
      const boxH = PAGE_H - 2 * FOOTER_ZONE - 10;
      const scale = Math.min(boxW / props.width, boxH / props.height);
      const w = props.width * scale;
      const h = props.height * scale;
      doc.addImage(
        dataUrl,
        props.fileType === "PNG" ? "PNG" : "JPEG",
        (PAGE_W - w) / 2,
        FOOTER_ZONE / 2 + 6,
        w,
        h,
      );
    } catch (error) {
      console.warn(
        `Referral letter: failed to render image page (${image.label}).`,
        error,
      );
    }
  }
}

/* ─── public API ─── */

/** Generates one branded referral-letter PDF and triggers the browser save. */
export async function generateReferralLetterPdf(
  data: ReferralLetterData,
  images: ReferralLetterImage[] = [],
): Promise<void> {
  const logoDataUrl = await loadLogoDataUrl();

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const headerEnd = drawHeader(doc, logoDataUrl);

  // Centered title
  let cursorY = headerEnd + 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setText(doc, REFERRAL_PALETTE.primary);
  doc.text("REFERRAL LETTER", PAGE_W / 2, cursorY, { align: "center" });

  cursorY += 8;

  cursorY = drawPatientGrid(doc, data, cursorY);
  cursorY = drawRecipientBlock(doc, data, cursorY);

  // Dear Doctor line
  cursorY = bodyText(
    doc,
    `Dear ${greetingName(data.recipient.name)},`,
    cursorY,
    { size: 10.5 },
  );

  // Referring line
  const patientLastName = data.patient.fullName
    .replace(/^Mr\.?\s*/i, "")
    .trim();
  cursorY = bodyText(
    doc,
    `I am referring Mr ${patientLastName} for your specialist assessment and further management.`,
    cursorY,
  );

  cursorY = drawClinicalSections(doc, data, cursorY);
  cursorY = drawInvestigationsTable(doc, data, cursorY);
  drawSignatureBlock(doc, data.referringDoctor.fullName, cursorY);
  drawFooterWave(doc);

  await appendAttachmentPages(doc, images);

  const lastName =
    data.patient.fullName
      .trim()
      .split(/\s+/)
      .pop()
      ?.replace(/[^\w-]/g, "") || "patient";
  const stamp = data.referralDate.toISOString().slice(0, 10).replace(/-/g, "");
  doc.save(`referral-${lastName}-${stamp}.pdf`);
}

/**
 * Multi-referral export: every letter starts on a fresh page of one document.
 */
export async function generateReferralLettersPdf(
  letters: Array<{ data: ReferralLetterData; images?: ReferralLetterImage[] }>,
): Promise<void> {
  if (!letters.length) return;
  const [first, ...rest] = letters;
  const logoDataUrl = await loadLogoDataUrl();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let isFirst = true;

  for (const letter of letters) {
    if (!isFirst) {
      doc.addPage();
      drawFooterWave(doc);
    }
    const headerEnd = drawHeader(doc, logoDataUrl);
    let cursorY = headerEnd + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    setText(doc, REFERRAL_PALETTE.primary);
    doc.text("REFERRAL LETTER", PAGE_W / 2, cursorY, { align: "center" });
    cursorY += 8;
    cursorY = drawPatientGrid(doc, letter.data, cursorY);
    cursorY = drawRecipientBlock(doc, letter.data, cursorY);

    // Dear Doctor line
    cursorY = bodyText(
      doc,
      `Dear ${greetingName(letter.data.recipient.name)},`,
      cursorY,
      { size: 10.5 },
    );

    // Referring line
    const letterPatientLastName = letter.data.patient.fullName
      .replace(/^Mr\.?\s*/i, "")
      .trim();
    cursorY = bodyText(
      doc,
      `I am referring Mr ${letterPatientLastName} for your specialist assessment and further management.`,
      cursorY,
    );
    cursorY = drawClinicalSections(doc, letter.data, cursorY);
    cursorY = drawInvestigationsTable(doc, letter.data, cursorY);
    drawSignatureBlock(doc, letter.data.referringDoctor.fullName, cursorY);
    drawFooterWave(doc);
    if (letter.images?.length && !isFirst === false) {
      // attachment pages are only rendered in the single-letter flow
    }
    isFirst = false;
  }
  void first;
  void rest;

  doc.save("referral-letters.pdf");
}
