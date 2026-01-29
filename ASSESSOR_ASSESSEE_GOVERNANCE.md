# Assessor–Assessee Mapping (Governance & Conflict-of-Interest Control)

This document describes how the platform enforces who can assess whom, to avoid bias and maintain credibility of assessment data.

## Base Rules (Enforced in Application)

1. **No self-assessment**  
   An assessor cannot assess themselves.

2. **No assessing direct or indirect reportees**  
   An assessor (manager) must not assess anyone in their own reporting line (direct or indirect reportees). This prevents "marking your own homework" and reduces bias.

## Admin Overrides

Admins can explicitly allow or block specific assessor ↔ assessee pairs via **Admin Dashboard → Management → Assessor–Assessee Mapping**.

- **Allow**: Permits an assessor to assess a specific person even if that person is in their reporting line (e.g. cross-functional or designated populations).
- **Block**: Prevents an assessor from assessing a specific person even when they would otherwise be eligible.

Overrides are stored in the `assessor_assessee_overrides` table and applied in addition to the base rules.

## Eligibility Logic (Summary)

For a given assessor, eligible trainers are:

- All trainers who are **not** the assessor (no self),
- **and** not in the assessor’s reporting line (direct or indirect reportees), **unless** there is an **Allow** override for that pair,
- **and** not **Block**ed by an override.

Mapping is **admin-driven**, not user-driven: only admins can add, change, or remove overrides.

## Rationale

- **Avoid bias**: Prevent managers from assessing their own team where bias or conflict may exist.
- **Maintain credibility**: Ensure assessment data is seen as fair and explainable to leadership.
- **Audit readiness**: This logic is documented here and can be explained to stakeholders (e.g. Som).

## Technical References

- **Eligibility utility**: `src/utils/assessorAssesseeEligibility.ts`  
  - `getEligibleTrainerIdsForAssessor(assessorId)`  
  - Uses `profiles.reporting_manager_id` to build reporting line; applies overrides from `assessor_assessee_overrides`.
- **Database**: `assessor_assessee_overrides` (see `migrations/assessor-assessee-overrides.sql`).
- **Admin UI**: **Assessor–Assessee Mapping** under Management in the Admin Dashboard.
