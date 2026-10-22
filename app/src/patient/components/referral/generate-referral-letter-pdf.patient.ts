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
} from "@/shared/utils/pdf-branding.util";
import { withDoctorTitle } from "@/shared/utils/doctor-name.util";
import {
  toFileDateStamp,
  toFileSafeSegment,
  type GeneratedPdf,
} from "@/shared/utils/pdf-download.util";
import type { ReferralLetterData } from "@/patient/components/referral/referral-letter-data.types.patient";

export type { ReferralLetterData } from "@/patient/components/referral/referral-letter-data.types.patient";

/* ─── letter sections ─── */

function greetingName(recipientName: string): string {
  // A single, canonical "Dr" prefix — the doctor may have typed it already.
  // Fall back to a generic salutation when no specialist name was recorded.
  return withDoctorTitle(recipientName) || "Doctor";
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
      cellPadding: 2.2,
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
  return (table?.finalY ?? cursorY) + 6;
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
    withDoctorTitle(data.recipient.name),
    ...(data.recipient.specialty ? [data.recipient.specialty] : []),
    data.recipient.hospital,
    ...data.recipient.addressLines,
  ].filter((line) => line.trim().length > 0);
  lines.forEach((line) => {
    doc.text(line, MARGIN, y);
    y += 4.6;
  });
  return y + 2.5;
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
      cellPadding: 2.2,
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
  return (table?.finalY ?? y) + 6;
}

/* ─── public API ─── */

function referralFileName(
  data: ReferralLetterData,
  fileNameSuffix?: string,
): string {
  const lastName =
    data.patient.fullName
      .trim()
      .split(/\s+/)
      .pop()
      ?.replace(/[^\w-]/g, "") || "patient";
  const stamp = toFileDateStamp(data.referralDate);
  const suffix = fileNameSuffix ? `-${toFileSafeSegment(fileNameSuffix)}` : "";
  return `referral-${toFileSafeSegment(lastName)}${suffix}-${stamp}.pdf`;
}

/**
 * Builds one branded referral-letter PDF and returns it for downloading.
 *
 * `fileNameSuffix` keeps exports of several referrals for the same patient
 * from colliding — the grouped history export passes the referral specialty.
 */
export async function createReferralLetterPdf(
  data: ReferralLetterData,
  options?: { fileNameSuffix?: string },
): Promise<GeneratedPdf> {
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

  return {
    blob: doc.output("blob"),
    fileName: referralFileName(data, options?.fileNameSuffix),
  };
}
