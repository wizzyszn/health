/**
 * Company branding + palette for generated documents (referral letters).
 * Single source of truth; update contact details here when the stakeholder
 * confirms finals (spec §open-items).
 */
export const COMPANY = {
  /** Official registered name — used in signature blocks. */
  name: "Carelexa Healthcare Limited",
  /** Brand name shown on letterheads. */
  displayName: "Carelexa",
  phone: "+44 7412 345678",
  email: "hello@carelexa.com",
  website: "www.carelexa.net",
  motto: "Your health, our priority",
} as const;

/**
 * Letter palette sampled from the approved referral template
 * (WhatsApp reference image, Aug 2026). Used by both the on-screen preview
 * and the jsPDF generator so they stay visually identical.
 */
export const REFERRAL_PALETTE = {
  /** Section headings, table header fills. */
  primary: [91, 45, 142] as [number, number, number], // #5B2D8E
  /** Logo accent / footer wave teal. */
  accent: [43, 181, 160] as [number, number, number], // #2BB5A0
  /** Title / strong text. */
  ink: [31, 36, 48] as [number, number, number], // #1F2430
  /** Body copy secondary tone. */
  muted: [107, 114, 128] as [number, number, number], // #6B7280
  /** Patient-grid fill (light lavender). */
  gridFill: [243, 239, 250] as [number, number, number], // #F3EFFA
  /** Hairline rules and table borders. */
  rule: [203, 213, 225] as [number, number, number], // #CBD5E1
} as const;
