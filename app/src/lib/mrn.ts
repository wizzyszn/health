/**
 * MRN display helpers.
 *
 * The backend owns MRN generation and persistence. The UI must never derive an
 * MRN from an id or other client-side value — it only normalizes and displays
 * the value returned by the API.
 */
export const MRN_NOT_ASSIGNED = "Not assigned";

export function normalizeMrn(mrn?: string | null): string | null {
  const value = typeof mrn === "string" ? mrn.trim() : "";
  return value || null;
}

export function displayMrn(mrn?: string | null): string {
  return normalizeMrn(mrn) ?? MRN_NOT_ASSIGNED;
}
