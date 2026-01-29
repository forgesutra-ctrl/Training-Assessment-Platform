# One-Year Seed Data Guide

This guide explains how to get **one full year** of seed data so that **Trainer**, **Manager**, and **Admin** sections show data no matter which button or tab you click.

---

## Prerequisites

1. **Database schema**
   - Your `assessments` table must use the **21-parameter** schema (not the old 6-parameter one).
   - If you used `MASTER_SETUP.sql`, run these in the **Supabase SQL Editor** (in order):
     1. **`migrations/update-to-21-parameters.sql`** – adds the 21 parameter columns (and drops old ones).
     2. **`migrations/fix-triggers-for-21-parameters.sql`** – updates trigger functions so they use the new columns.  
     If you skip (2), inserts will fail with: *record "new" has no field "trainers_readiness"*.

2. **Environment**
   - `.env` must have:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_SERVICE_ROLE_KEY` (from Supabase Dashboard → Settings → API → service_role key)

---

## How to Run the Seed

From the project root:

```bash
npm run seed
```

This runs `src/scripts/seedData.ts`, which:

1. **Creates teams** (2): Sales Training Team, Technical Training Team  
2. **Creates auth users + profiles** (9): 1 admin, 2 managers, 6 trainers  
3. **Creates ~144 assessments** over the **last 12 months**:
   - 12 months × 6 (manager–trainer) pairs × 2 assessments per month  
   - Each assessment has all **21 parameters** (ratings + comments) and **overall_comments** (≥20 chars)  
   - Assessor–assessee rules are respected: Manager 1 assesses only T4, T5, T6; Manager 2 assesses only T1, T2, T3  

---

## What Gets Created

| Entity        | Count | Details |
|---------------|-------|--------|
| Teams         | 2     | Sales Training Team, Technical Training Team |
| Auth users    | 9     | 1 admin, 2 managers, 6 trainers (emails below) |
| Profiles      | 9     | Linked to auth users, with `team_id` and `reporting_manager_id` |
| Assessments   | ~144  | 1 year of dates; 21 params + overall_comments per row |

**Eligible assessor–trainer pairs (no direct reports):**

- **Manager 1** (Sales) → Trainer 4, 5, 6 (Technical)  
- **Manager 2** (Technical) → Trainer 1, 2, 3 (Sales)  

---

## Test Credentials

All users use password: **`Test@123456`**

| Email             | Name          | Role    | Team / Notes |
|------------------|---------------|---------|----------------|
| admin1@test.com  | Admin User    | admin   | Full access   |
| manager1@test.com| Manager One   | manager | Sales Training Team |
| manager2@test.com| Manager Two   | manager | Technical Training Team |
| trainer1@test.com| Trainer Alpha | trainer | Sales; reports to Manager 1 |
| trainer2@test.com| Trainer Beta   | trainer | Sales; reports to Manager 1 |
| trainer3@test.com| Trainer Gamma  | trainer | Sales; reports to Manager 1 |
| trainer4@test.com| Trainer Delta  | trainer | Technical; reports to Manager 2 |
| trainer5@test.com| Trainer Epsilon| trainer | Technical; reports to Manager 2 |
| trainer6@test.com| Trainer Zeta   | trainer | Technical; reports to Manager 2 |

---

## Where Data Appears (Trainer / Manager / Admin)

### Trainer Dashboard

- **Performance at a glance** – Current month vs last month, total assessments  
- **What’s improving / Needs attention** – From category averages across assessments  
- **Learning recommendations** – Least performed areas + AI recommendations (uses 21-param data and overall_comments)  
- **Activity feed** – Recent assessments  

**Who sees what:** Each trainer sees only **their own** assessments (e.g. Trainer Alpha sees assessments where `trainer_id` = Trainer Alpha). With 12 months of data, every trainer has multiple assessments.

---

### Manager Dashboard

- **Stats cards** – Assessments this month, trainers assessed, average rating  
- **Recommendations** – Unassessed trainers this month, overdue, suggested to assess  
- **Recent assessments** – List of assessments **this manager** created  
- **Activity / actions** – Tied to managers’ assessments  

**Who sees what:** Manager 1 sees only assessments where `assessor_id` = Manager 1 (i.e. T4, T5, T6). Manager 2 sees only assessments where `assessor_id` = Manager 2 (T1, T2, T3). Every manager has ~72 assessments over the year.

---

### Admin Dashboard

All tabs use the same seed data:

| Tab                     | What you see |
|-------------------------|--------------|
| **Overview**            | Platform stats (total trainers, assessments this month, platform average, activity rate) |
| **Trainer Performance**| All trainers with stats (month/quarter/YTD/all-time), trends, assessment list with overall_comments |
| **Manager Activity**    | Which managers assessed whom, counts, activity over time |
| **Time Analysis**       | Assessments over time (monthly distribution over the year) |
| **User Management**     | All 9 profiles (admin, managers, trainers) and teams |
| **Assessor–Assessee Mapping** | Eligibility and overrides (base data from profiles) |
| **Audit Log**           | Populated when actions are performed (e.g. after seed, when users perform actions) |
| **Predictive / Comparative / Correlation / Scenario / Trend Alerts** | Built from the same assessments and trainer/manager data |
| **Data Studio**         | Charts and filters over assessments and profiles |
| **Report Templates**    | Report definitions; data comes from same tables |

With **one year** of assessments, time-based filters (current month, last 3 months, YTD, etc.) and trends all show non-empty, realistic data.

---

## Re-running the Seed

- **Teams and profiles** – Upserted by id; safe to run again.  
- **Assessments** – Inserted with generated ids. Running seed again will **add another ~144 rows** (duplicate dates per pair possible). To start clean, delete assessments for the test users (e.g. by `trainer_id` / `assessor_id` in the test UUID set) before re-running, or use a fresh project.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `record "new" has no field "trainers_readiness"` | Your DB triggers still use the old 6-parameter columns. Run **`migrations/fix-triggers-for-21-parameters.sql`** in the Supabase SQL Editor, then run `npm run seed` again. |
| Missing Supabase credentials | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_SERVICE_ROLE_KEY` to `.env` (service role from Dashboard → Settings → API). |

---

## Summary

- **One command:** `npm run seed`  
- **One year of data:** 12 months × 6 pairs × 2 ≈ 144 assessments, all with 21 parameters and overall_comments.  
- **Visibility:** Trainer dashboard (my assessments + learning recs), Manager dashboard (my assessments + stats), and every Admin tab (overview, trainer performance, manager activity, time analysis, etc.) show consistent, realistic data for demos and QA.
