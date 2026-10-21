import type { ReferralGroup } from "./referral.types.patient";

type ReferralGroupReferrals = Pick<ReferralGroup, "referrals">;

/**
 * Returns the unique specialties covered by a consultation's referrals.
 * Legacy referrals without an approved specialty are ignored.
 */
export function getReferralGroupSpecialties(
  group: ReferralGroupReferrals,
): string[] {
  const specialties = new Map<string, string>();

  for (const referral of group.referrals ?? []) {
    const specialty = referral.specialty?.trim();
    if (!specialty) continue;

    const key = specialty.toLowerCase();
    if (!specialties.has(key)) specialties.set(key, specialty);
  }

  return Array.from(specialties.values());
}

/**
 * The specialty is what the patient is being referred to, so it is a more
 * meaningful group title than the generic consultation title.
 */
export function getReferralGroupTitle(group: ReferralGroupReferrals): string {
  const specialties = getReferralGroupSpecialties(group);
  return specialties.length > 0 ? specialties.join(", ") : "Referral";
}
