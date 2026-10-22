/**
 * Doctor-name formatting for printed letters.
 *
 * The specialist's name is free text on the referral form, so the stored value
 * may arrive with a title ("Dr Henry", "Dr. Henry", "doctor henry") or without
 * one ("Henry"). Letter templates always print the title themselves, which used
 * to produce "Dr Dr Henry". These helpers strip whichever doctor title the
 * doctor typed and add the canonical "Dr " prefix exactly once.
 */

/** Matches a leading doctor title, tolerating "Dr", "Dr.", "Drs" and "Doctor". */
const DOCTOR_TITLE_PATTERN = /^(?:drs?|doctor)\.?(?![a-z])\s*/i;

/** Non-doctor honorifics are respected rather than overridden with "Dr". */
const OTHER_HONORIFIC_PATTERN =
  /^(?:professor|prof|mr|mrs|ms|miss)\.?(?![a-z])\s*/i;

/** Collapses the stray whitespace doctors pick up when typing names. */
function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Removes every leading doctor title from a name.
 * `"Dr. Dr Henry"` → `"Henry"`, `"Henry"` → `"Henry"`.
 */
export function stripDoctorTitle(name: string | null | undefined): string {
  let result = collapseWhitespace(name ?? "");
  let previous = "";

  // Loop because a doctor may have typed the title more than once.
  while (result !== previous && result) {
    previous = result;
    result = result.replace(DOCTOR_TITLE_PATTERN, "").trim();
  }

  return result;
}

/**
 * Formats a specialist name for a letter, guaranteeing a single "Dr" prefix:
 * `"Henry"` → `"Dr Henry"`, `"Dr. Henry"` → `"Dr Henry"`,
 * `"Dr Dr Henry"` → `"Dr Henry"`.
 *
 * Other titles ("Prof Henry", "Mr Henry") are left untouched so the letter
 * does not demote them to "Dr". A blank name stays blank.
 */
export function withDoctorTitle(name: string | null | undefined): string {
  const cleaned = collapseWhitespace(name ?? "");
  if (!cleaned) return "";
  if (OTHER_HONORIFIC_PATTERN.test(cleaned)) return cleaned;

  const withoutTitle = stripDoctorTitle(cleaned);
  return withoutTitle ? `Dr ${withoutTitle}` : "Dr";
}
