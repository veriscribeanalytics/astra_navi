/**
 * Age utilities for DPDP Act 2023 §9 compliance.
 *
 * Astra Mitra is an adults-only (18+) service. Minors' personal data (birth
 * details) must not enter the system without verifiable parental consent, which
 * we do not implement — so instead we block under-18 data entirely at every
 * point a date of birth is captured (signup, profile, family, compatibility).
 *
 * The calendar math here mirrors the original signup gate in
 * `RegisterFlow.tsx` so every form gates identically.
 */

/**
 * Returns true if the given date of birth makes the person younger than 18.
 *
 * Uses whole-calendar-date comparison (not millisecond arithmetic) so a person
 * turning 18 *today* is treated as an adult. Returns `false` for empty or
 * unparseable input — presence/format is validated separately by each form, so
 * this helper never blocks on missing data.
 *
 * @param dob ISO date string, e.g. "2010-05-14" (from an <input type="date">)
 */
export function isUnder18(dob: string): boolean {
  if (!dob) return false;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const eighteenAgo = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  return d > eighteenAgo;
}
