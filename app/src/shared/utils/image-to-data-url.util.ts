/**
 * Image → data URL helpers for PDF generation.
 *
 * Investigation result uploads live on Cloudinary/S3-style CDNs. Those hosts
 * answer with a wildcard `Access-Control-Allow-Origin`, which browsers reject
 * when the request carries credentials — so try the public, credential-less
 * fetch first and only fall back to a credentialed fetch for same-origin URLs
 * that actually need the session.
 */

const MAX_CACHE_ENTRIES = 40;
const MAX_CACHE_CHARS = 24 * 1024 * 1024;
const dataUrlCache = new Map<string, string>();
let cachedChars = 0;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fetchOnce(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`fetch ${response.status}`);
  return blobToDataUrl(await response.blob());
}

/** Caches successful conversions so repeat downloads skip the network. */
function remember(url: string, dataUrl: string): string {
  // Don't keep an individual huge upload in memory for the whole session.
  if (dataUrl.length > MAX_CACHE_CHARS) return dataUrl;

  while (
    dataUrlCache.size > 0 &&
    (dataUrlCache.size >= MAX_CACHE_ENTRIES ||
      cachedChars + dataUrl.length > MAX_CACHE_CHARS)
  ) {
    const oldest = dataUrlCache.keys().next().value;
    if (oldest === undefined) break;
    cachedChars -= dataUrlCache.get(oldest)?.length ?? 0;
    dataUrlCache.delete(oldest);
  }

  dataUrlCache.set(url, dataUrl);
  cachedChars += dataUrl.length;
  return dataUrl;
}

/**
 * Loads an image URL as a data URL suitable for jsPDF. Returns null when the
 * image cannot be read (network error, CORS, revoked upload) so callers can
 * skip that page instead of failing the whole document.
 */
export async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  const cached = dataUrlCache.get(url);
  if (cached) return cached;

  try {
    return remember(url, await fetchOnce(url));
  } catch (publicError) {
    try {
      return remember(url, await fetchOnce(url, { credentials: "include" }));
    } catch (error) {
      console.warn(`PDF: skipped image (${url}).`, error ?? publicError);
      return null;
    }
  }
}

/** Loads many images in parallel, dropping failures. */
export async function fetchImagesAsDataUrls(urls: string[]): Promise<string[]> {
  const results = await Promise.all(urls.map(fetchImageAsDataUrl));
  return results.filter((dataUrl): dataUrl is string => !!dataUrl);
}
