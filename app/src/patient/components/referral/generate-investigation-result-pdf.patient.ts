import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { REFERRAL_PALETTE } from "@/shared/constants/company.constants";
import {
  drawFooterWave,
  drawHeader,
  loadLogoDataUrl,
  setText,
  CONTENT_W,
  FOOTER_ZONE,
  MARGIN,
  PAGE_H,
  PAGE_W,
} from "@/shared/utils/pdf-branding.util";
import { fetchImagesAsDataUrls } from "@/shared/utils/image-to-data-url.util";
import {
  toFileDateStamp,
  toFileSafeSegment,
  type GeneratedPdf,
} from "@/shared/utils/pdf-download.util";

/** Hard cap so one investigation can never produce an unwieldy document. */
const MAX_IMAGES_PER_RESULT = 30;

/** Everything needed to print one investigation's uploaded result. */
export interface InvestigationResultPdfSource {
  investigationId?: string;
  investigationName: string;
  /** ISO timestamp the investigation was requested/uploaded. */
  investigationDate?: string;
  patientName: string;
  mrn?: string;
  imageUrls: string[];
}

function formatResultDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function drawResultPage(
  doc: jsPDF,
  source: InvestigationResultPdfSource,
  imageDataUrl: string,
  index: number,
  total: number,
  logoDataUrl: string | null,
): void {
  const headerEnd = drawHeader(doc, logoDataUrl);
  let cursorY = headerEnd + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setText(doc, REFERRAL_PALETTE.primary);
  doc.text("INVESTIGATION RESULT", PAGE_W / 2, cursorY, { align: "center" });
  cursorY += 8;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: REFERRAL_PALETTE.ink,
    },
    columnStyles: {
      0: {
        cellWidth: 28,
        fontStyle: "bold",
        fillColor: REFERRAL_PALETTE.gridFill,
      },
      2: {
        cellWidth: 28,
        fontStyle: "bold",
        fillColor: REFERRAL_PALETTE.gridFill,
      },
    },
    body: [
      [
        "Investigation",
        source.investigationName,
        "Date",
        formatResultDate(source.investigationDate),
      ],
      ["Patient", source.patientName, "MRN", source.mrn || "—"],
    ],
  });

  const table = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  cursorY = (table?.finalY ?? cursorY) + 8;

  const caption =
    total > 1 ? `Result image ${index + 1} of ${total}` : "Result image";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, REFERRAL_PALETTE.muted);
  doc.text(caption, MARGIN, cursorY);
  cursorY += 5;

  const boxTop = cursorY;
  const boxBottom = PAGE_H - FOOTER_ZONE - 4;

  try {
    const props = doc.getImageProperties(imageDataUrl);
    const scale = Math.min(
      CONTENT_W / props.width,
      (boxBottom - boxTop) / props.height,
    );
    const width = props.width * scale;
    const height = props.height * scale;
    const x = (PAGE_W - width) / 2;
    const y = boxTop + (boxBottom - boxTop - height) / 2;
    doc.addImage(
      imageDataUrl,
      props.fileType === "PNG" ? "PNG" : "JPEG",
      x,
      y,
      width,
      height,
    );
  } catch (error) {
    console.warn(
      `Investigation result PDF: could not render image for ${source.investigationName}.`,
      error,
    );
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    setText(doc, REFERRAL_PALETTE.muted);
    doc.text("This result image could not be rendered.", MARGIN, boxTop + 10);
  }

  drawFooterWave(doc);
}

function buildResultPdf(
  source: InvestigationResultPdfSource,
  images: string[],
  logoDataUrl: string | null,
): GeneratedPdf {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  images.forEach((image, index) => {
    if (index > 0) doc.addPage();
    drawResultPage(doc, source, image, index, images.length, logoDataUrl);
  });

  const stamp = toFileDateStamp(
    source.investigationDate ? new Date(source.investigationDate) : new Date(),
  );
  const shortId = source.investigationId
    ? `-${source.investigationId.slice(-6)}`
    : "";
  const fileName = `result-${toFileSafeSegment(source.investigationName)}${shortId}-${stamp}.pdf`;

  return { blob: doc.output("blob"), fileName };
}

/**
 * Builds one PDF per investigation that has readable result images.
 *
 * Images are downloaded in parallel (and cached per URL), then each
 * investigation becomes its own document with the investigation name, patient
 * and image count printed on every page. Investigations whose uploads cannot
 * be loaded are skipped rather than producing an empty file.
 */
export async function createInvestigationResultPdfs(
  sources: InvestigationResultPdfSource[],
): Promise<GeneratedPdf[]> {
  const withImages = sources.filter((source) => source.imageUrls.length > 0);
  if (!withImages.length) return [];

  const [logoDataUrl, loaded] = await Promise.all([
    loadLogoDataUrl(),
    Promise.all(
      withImages.map(async (source) => ({
        source,
        images: await fetchImagesAsDataUrls(
          source.imageUrls.slice(0, MAX_IMAGES_PER_RESULT),
        ),
      })),
    ),
  ]);

  return loaded
    .filter((entry) => entry.images.length > 0)
    .map((entry) => buildResultPdf(entry.source, entry.images, logoDataUrl));
}
