/**
 * Small helpers for turning generated jsPDF documents into browser downloads.
 *
 * jsPDF can only `save()` one file at a time; a referral download now produces
 * the letter plus one PDF per attached investigation. Triggering several
 * anchor clicks back-to-back makes browsers drop all but the first file, so we
 * space them out slightly.
 */

export interface GeneratedPdf {
  blob: Blob;
  fileName: string;
}

const MULTI_DOWNLOAD_GAP_MS = 250;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Turns a free-text label into a lower-case, hyphenated filename segment. */
export function toFileSafeSegment(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file"
  );
}

/** Formats a date as yyyymmdd for filenames. */
export function toFileDateStamp(date: Date): string {
  if (Number.isNaN(date.getTime())) return "undated";
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

export function downloadPdf({ blob, fileName }: GeneratedPdf): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start reading the blob before revoking it.
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Downloads files one after another, with a short gap so browsers treat each
 * as an intentional download. Returns how many files were triggered.
 */
export async function downloadPdfFiles(files: GeneratedPdf[]): Promise<number> {
  let downloaded = 0;
  for (const file of files) {
    downloadPdf(file);
    downloaded += 1;
    if (downloaded < files.length) await wait(MULTI_DOWNLOAD_GAP_MS);
  }
  return downloaded;
}
