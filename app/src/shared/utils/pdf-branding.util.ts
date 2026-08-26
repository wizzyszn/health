import jsPDF from "jspdf";
import {
  COMPANY,
  REFERRAL_PALETTE,
} from "@/shared/constants/company.constants";

export type Rgb = readonly [number, number, number];

const PAGE_W = 210;
const PAGE_H = 297;
export const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_ZONE = 24;

export function setFill(doc: jsPDF, c: Rgb) {
  doc.setFillColor(c[0], c[1], c[2]);
}
export function setText(doc: jsPDF, c: Rgb) {
  doc.setTextColor(c[0], c[1], c[2]);
}
export function setDraw(doc: jsPDF, c: Rgb) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

/* ─── logo (cached dataURL via fetch → FileReader; Vite URL import) ─── */

let logoCache: string | null = null;

export async function loadLogoDataUrl(): Promise<string | null> {
  if (logoCache !== null) return logoCache || null;
  try {
    const { default: url } = await import("@/assets/images/carelexa.png");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`logo fetch ${res.status}`);
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    logoCache = dataUrl;
  } catch (error) {
    console.warn("PDF branding: could not load logo asset.", error);
    logoCache = "";
  }
  return logoCache || null;
}

export function drawLogo(
  doc: jsPDF,
  dataUrl: string,
  x: number,
  y: number,
  h: number,
) {
  try {
    const props = doc.getImageProperties(dataUrl);
    const w = Math.max(10, (props.width / props.height) * h);
    doc.addImage(
      dataUrl,
      props.fileType === "PNG" ? "PNG" : "JPEG",
      x,
      y,
      w,
      h,
    );
  } catch (error) {
    console.warn("PDF branding: logo render skipped.", error);
  }
}

/* ─── page chrome ─── */

export function drawFooterWave(doc: jsPDF) {
  const bandTop = PAGE_H - 14;
  setFill(doc, REFERRAL_PALETTE.primary);
  doc.triangle(0, PAGE_H, 0, bandTop + 4, PAGE_W / 2, bandTop - 2, "F");
  setFill(doc, REFERRAL_PALETTE.accent);
  doc.triangle(
    PAGE_W,
    PAGE_H,
    PAGE_W,
    bandTop + 2,
    PAGE_W / 2,
    bandTop + 1,
    "F",
  );
}

export function drawHeader(doc: jsPDF, logoDataUrl: string | null): number {
  const top = 14;
  const logoH = 14;
  // Measure motto width so we can centre the logo above it
  const mottoText = `-- ${COMPANY.motto} --`;
  if (COMPANY.motto) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
  }
  const mottoW = doc.getTextWidth(mottoText);
  if (logoDataUrl) {
    const props = doc.getImageProperties(logoDataUrl);
    const logoW = Math.max(10, (props.width / props.height) * logoH);
    // Centre logo above the motto text, both anchored at MARGIN
    const logoX = MARGIN + (mottoW - logoW) / 2;
    drawLogo(doc, logoDataUrl, logoX, top, logoH);
  }
  // Motto left-aligned at MARGIN
  if (COMPANY.motto) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    setText(doc, REFERRAL_PALETTE.muted);
    doc.text(mottoText, MARGIN, top + logoH + 3);
  }
  // Contact info on the right
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, REFERRAL_PALETTE.muted);
  [COMPANY.phone, COMPANY.email, COMPANY.website].forEach((line, i) => {
    doc.text(line, PAGE_W - MARGIN, top + 3.5 + i * 4.5, { align: "right" });
  });
  const ruleY = top + 26;
  setDraw(doc, REFERRAL_PALETTE.rule);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, ruleY, PAGE_W - MARGIN, ruleY);
  return ruleY;
}

/** Page-break helper: footer + addPage when `needed` pt won't fit above the wave. */
export function ensureSpace(
  doc: jsPDF,
  cursorY: number,
  needed: number,
): number {
  if (cursorY + needed <= PAGE_H - FOOTER_ZONE) return cursorY;
  drawFooterWave(doc);
  doc.addPage();
  return MARGIN + 8;
}

export function sectionHeading(
  doc: jsPDF,
  title: string,
  cursorY: number,
): number {
  const y = ensureSpace(doc, cursorY, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  setText(doc, REFERRAL_PALETTE.primary);
  doc.text(title.toUpperCase(), MARGIN, y);
  return y + 6;
}

export function bodyText(
  doc: jsPDF,
  text: string,
  cursorY: number,
  opts?: { size?: number; color?: Rgb },
): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(opts?.size ?? 9.5);
  setText(doc, opts?.color ?? REFERRAL_PALETTE.ink);
  const lines = doc.splitTextToSize(
    text && text.trim() ? text : "—",
    CONTENT_W,
  );
  const y = ensureSpace(doc, cursorY, lines.length * 5 + 2);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 5 + 3;
}

/** Draw the standard Carelexa signature block at the bottom of a letter. */
export function drawSignatureBlock(
  doc: jsPDF,
  doctorName: string,
  cursorY: number,
): void {
  let y = ensureSpace(doc, cursorY, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setText(doc, REFERRAL_PALETTE.ink);
  doc.text("Kind regards,", MARGIN, y);
  y += 12;

  // Doctor name in bold
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, REFERRAL_PALETTE.ink);
  doc.text(doctorName, MARGIN, y);
  y += 7;

  // Company name
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(doc, REFERRAL_PALETTE.muted);
  doc.text(COMPANY.name, MARGIN, y);
  y += 5;

  // Phone
  doc.text(COMPANY.phone, MARGIN, y);
  y += 5;

  // Email
  doc.text(COMPANY.email, MARGIN, y);
}

export { PAGE_W, PAGE_H, CONTENT_W, FOOTER_ZONE };
