# Referral Letter & PDF Rebuild — Implementation Status

> Plan: `.hermes/plans/2026-08-24_165626-referral-letter-rebuild-plan.md`
> Status date: 2026-08-25

## Task status

| Task                                       | Status              | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 — Company + catalog constants            | Done (pre-existing) | `src/shared/constants/company.constants.ts` (COMPANY, REFERRAL_PALETTE), `referral-catalogs.constants.ts` (REFERRAL_SPECIALTIES mirroring backend enum, APPROVED_HOSPITALS with full addresses, `findApprovedHospital`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2 — Extend referral contract               | Done                | `ReferralItem` (+`specialty?`, `hospital_address?`, `attachment_investigation_ids?`), all doctor.service create/update/list/get payloads and response shapes, patient.service single/list/grouped referral responses, `referralFormSchema` (+specialty/hospital_address/attachment_investigation_ids; dropped dead `referred_doctor_name`). **Backend fields landed 2026-08-25** (see revision pass below)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 3 — Branded PDF generator v2               | Done                | `generate-referral-letter-pdf.patient.ts` rewritten: carelexa.png header (cached dataURL fetch→FileReader), right-aligned contact column from COMPANY, centered REFERRAL LETTER title, 4-col autotable patient grid (lavender #F3EFFA, MRN included, **no address row**), recipient block (name/specialty/hospital/address lines), greeting + fixed opening line (never form fields), purple section headings (Clinical Summary / Relevant Medical History / Current Medications / Allergies → "No known drug allergies."), investigations table (purple header row), ☑/☐ attachments checklist, signature block with COMPANY name, purple→teal wave footer on every page, attachment result images appended one per page (center-fit A4 box, cap 20 pages, per-image try/catch skip+warn). Filenames `referral-{lastname}-{yyyymmdd}.pdf`. Multi-letter export via `generateReferralLettersPdf` |
| 4 — Attachments selector in modal          | Done                | Modal gains `patientId` prop → queries `getPatientInvestigationHistoryReq(patientId, {perPage:"50"})`; checklist of investigations with `result_images.length > 0` showing file counts; selection persisted as `attachment_investigation_ids`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 5 — Auto-populated sections + compact form | Done                | Modal gains `patientMedical` prop (allergies chips read-only, past-history summary — passed down from consultation space sidebar data, no refetch); Specialty Select over REFERRAL_SPECIALTIES; Hospital Select over APPROVED_HOSPITALS auto-writes `hospital_address[]` into hidden state (address preview shown under the select); free-text hospital fallback for legacy records                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 6 — Patient regeneration + delete v1       | Done                | All three patient download paths (`view-referral.page`, `single-consultation-details.page`, `referrals.page` grouped export) build `ReferralLetterData` via shared `buildReferralLetterData` mapper + resolve attached investigation images → identical generator. v1 MEDIAPP generator fully removed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 7 — QA matrix + docs                       | This doc            |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## QA matrix

1. **8 patient-grid fields incl. MRN; no address row** ✅ grid rows: Name/Date-of-Referral, DOB/Age, Gender/Phone, Email/MRN.
2. **Hospital pick auto-fills address** ✅ catalog select writes addressLines; rendered in recipient block and previewed under the select.
3. **Greeting without typing** ✅ derived at generation time from specialist_name ("Dear Dr. Okafor," handles existing "Dr." prefix).
4. **Empty allergies → "No known drug allergies."** ✅
5. **Uploads appended as pages, one image/page, order follows selection** ✅ (per-investigation sequential; selection order = checkbox toggle order).
6. **Long summary paginates** ✅ `ensureSpace` pager; footer drawn on every page after assembly.
7. **Template match (logo/contact/footer)** ⚠️ programmatic approximation of the wave (two filled triangles/bezier bands); needs side-by-side review against the template JPEG. COMPANY phone/email still TODO(stakeholder).
8. **Legacy referrals (no specialty/attachments) degrade** ✅ all fields optional; legacy non-catalog hospitals render name-only.
9. **Patient regeneration matches doctor copy** ✅ both use the same mapper + generator; doctor copy resolves images from the doctor-side history endpoint, patient side from their consultation investigations.

## Known gaps / follow-ups

- COMPANY contact details are placeholders pending stakeholder confirmation.
- Wave footer is an approximation — pixel review vs template JPEG outstanding.
- Custom Poppins font embed tracked as polish (helvetica used).
- Medication lines come from persisted consultation medication records only (both roles); there is no medications textarea by design (backend whitelists referral fields only).

---

## Revision pass — 2026-08-25 (stakeholder feedback)

1. **Specialty = specialty names, not consultant titles.** The Specialty field
   now lists what the provider _practices_ — "Cardiologist", "Dentist", … —
   sourced from `MEDICAL_SPECIALTY_OPTIONS`
   (`shared/constants/medical-specialty.constant.ts`, the master list) via
   `REFERRAL_SPECIALTIES`. The old "Consultant …" title list is gone.
   Specialist Name is now a plain text input ("Dr. Okoh"); the former
   specialty-suggesting combobox was deleted. Backend mirror:
   `ReferralSpecialtyEnum` (`consultations.enums.ts`) + `@IsEnum` on the DTO.
   Legacy persisted values ("Consultant Cardiologist") are normalized on load
   via `normalizeLegacySpecialty` (title stripped when the remainder matches;
   unknown values blank out for re-picking).
2. **Form order**: Specialist Name → Specialty (+ Hospital beside it) →
   Clinical Summary / Reason for Referral → Attach uploaded results.
3. **Hospitals moved to JSON**: `src/shared/constants/hospitals.catalog.json`
   (7 hospitals: Uyo, LUTH, Ekiti, UCH Ibadan, LASUTH, National Hospital
   Abuja, ABSU Abia). `APPROVED_HOSPITALS` hydrates from it at module load —
   expand the list without touching code. Each entry carries id, name, state,
   type, addressLines, phone.
4. **Attachments UX rebuilt** (was a bare checkbox list): header bar with live
   "n/N selected" pill + Select all / Clear all; tappable cards in a 2-col
   grid showing file count, category, upload date; selected state = indigo
   ring + tinted background + corner check badge; keyboard accessible
   (role=checkbox, Enter/Space toggles). Radix Checkbox-inside-label
   double-toggle hazard removed (single explicit toggle per card).
5. **Backend contract extended this pass**, applied to the project's backend
   at **`health-app/`** (sibling of `app/` in this workspace):
   DTO `CreateReferralDto`: +`specialty?` (`ReferralSpecialtyEnum` via
   `@Transform(normalizeSpecialtyInput)` + `@IsEnum`), +`hospital_address?`
   (string[]), +`attachment_investigation_ids?` (string[]); strict
   ValidationPipe would have 400'd them before.
   Model `Referral`: +specialty (enum, null default), +hospital_address
   ([String], []), +attachment_investigation_ids ([String], []).
   Service: `createReferral` persists the three fields; `updateReferral`
   passes them through and allows clearing.
   **Legacy-title compatibility**: staging had already shipped a
   "Consultant …" enum (response_code 006 proved it), so
   `LEGACY_REFERRAL_SPECIALTY_TITLES` maps all 14 retired titles onto name
   equivalents inside the pipe transform — old clients and stored values
   keep working; unknown values degrade to absent instead of failing saves.
   Regression spec `referral-specialty.spec.ts` replays request bodies
   through pipe-equivalent transform+validate (237/237 suite green).
   - `hospital` stays free-string at the API layer by design: the approved
     catalog is enforced in the UI select, while legacy records with
     non-catalog hospitals must keep passing validation on modal save.
   - Deploy note: staging runs a build with the OLD title-based enum; it must
     be redeployed from this backend for the fix to take effect.
6. **Patient view** (`view-referral.page.patient.tsx`): shows the Specialty
   row under Specialist when present.

Verification this pass: frontend `npm run build` ✓, `npm run test` 43/43 ✓,
`npm run check-lint` 0 errors ✓; backend `pnpm run build` ✓, `pnpm run test`
214/214 ✓.
