# Training Assessment Platform System (TAPS)
## Comprehensive Build, Technology Stack & Security Documentation

**Document Purpose:** Information security, cybersecurity, and system documentation for the Training Assessment Platform System (TAPS).  
**Classification:** Internal / Security-Relevant  
**Last Updated:** January 2026  
**Version:** 1.0  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Build System & Deployment](#3-build-system--deployment)
4. [Application Segments & Architecture](#4-application-segments--architecture)
5. [Data Architecture & Database](#5-data-architecture--database)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Information Security & Cybersecurity](#7-information-security--cybersecurity)
8. [Third-Party Integrations & External APIs](#8-third-party-integrations--external-apis)
9. [Environment & Secrets Management](#9-environment--secrets-management)
10. [Appendices](#10-appendices)

---

## 1. Executive Summary

TAPS is a **single-page application (SPA)** for managing training assessments. Managers assess trainers; trainers view their performance; admins manage users, analytics, and platform configuration. The frontend is a **React + TypeScript** application built with **Vite**, deployed on **Vercel**. The backend is **Supabase** (PostgreSQL, Auth, Row Level Security). No custom backend server runs in production—all server-side logic is Supabase (database, RLS, Auth).

**Security-relevant summary:**
- **Auth:** Supabase Auth (email/password, PKCE, session in `sessionStorage`).
- **Data access:** Enforced by Supabase Row Level Security (RLS); client uses only the **anon** key.
- **Sensitive env:** `VITE_SUPABASE_ANON_KEY`, optional `VITE_SUPABASE_SERVICE_ROLE_KEY` (scripts only), optional AI keys (`VITE_CLAUDE_API_KEY`, `VITE_OPENAI_API_KEY`).
- **External calls:** Supabase REST/Realtime; optional outbound to Anthropic and OpenAI when AI is enabled.
- **Input handling:** Centralized sanitization and HTML escaping for XSS mitigation; no `dangerouslySetInnerHTML` on user content in normal flows.

---

## 2. Technology Stack

### 2.1 Runtime & Language

| Layer | Technology | Version (approx.) | Notes |
|-------|------------|-------------------|--------|
| Runtime | Browser (ES2020+) | — | Target: modern browsers |
| Language | TypeScript | 5.2.x | Strict mode enabled |
| Module system | ESM | — | `"type": "module"` in package.json |

### 2.2 Frontend Core

| Dependency | Version | Purpose |
|------------|---------|--------|
| React | ^18.2.0 | UI framework |
| React DOM | ^18.2.0 | DOM rendering |
| React Router DOM | ^6.20.0 | Client-side routing |
| Lucide React | ^0.294.0 | Icons |
| Framer Motion | ^12.29.0 | Animations |
| React Hot Toast | ^2.4.1 | Toasts / notifications |
| React Joyride | ^2.9.3 | Onboarding / guided tour |
| Recharts | ^2.10.3 | Charts (analytics) |
| Canvas Confetti | ^1.9.4 | Celebrations |
| ExcelJS | ^4.4.0 | Excel export (reports) |
| Lodash | ^4.17.23 | Utilities |

### 2.3 Backend / Services

| Component | Technology | Notes |
|-----------|------------|--------|
| Database | PostgreSQL (Supabase) | Schema, RLS, functions, triggers |
| Auth | Supabase Auth | Email/password, JWT, PKCE |
| API surface | Supabase REST + Realtime | Auto-generated from schema; client uses anon key |
| Optional AI | Anthropic Claude API / OpenAI API | Only when `VITE_AI_ENABLED=true` and keys set |

### 2.4 Build & Tooling

| Tool | Version | Role |
|------|---------|------|
| Vite | ^7.3.1 | Bundler, dev server, production build |
| @vitejs/plugin-react | ^4.2.1 | React support for Vite |
| TypeScript | ^5.2.2 | Type checking |
| ESLint | ^8.55.0 | Linting |
| PostCSS / Autoprefixer | ^8.4.32 / ^10.4.16 | CSS processing |
| Tailwind CSS | ^3.3.6 | Styling |
| Terser | ^5.46.0 | Production minification |

### 2.5 Deployment & Hosting

| Layer | Technology | Notes |
|-------|------------|--------|
| Hosting | Vercel | Static SPA + serverless routing |
| Framework (Vercel) | vite | `vercel.json` specifies build command, output dir |
| CDN / caching | Vercel | Immutable assets; HTML non-cached per config |

---

## 3. Build System & Deployment

### 3.1 Scripts (package.json)

| Script | Command | Purpose |
|--------|---------|--------|
| `dev` | `vite` | Local development server |
| `build` | `vite build` | Production build (output: `dist`) |
| `build:prod` | `tsc && vite build --mode production` | Type-check + production build |
| `build:analyze` | `tsc && vite build --mode production && npx vite-bundle-visualizer` | Build + bundle analysis |
| `preview` | `vite preview` | Local preview of production build |
| `preview:prod` | `vite preview --mode production` | Preview in production mode |
| `lint` | `eslint . --ext ts,tsx ...` | Lint TypeScript/TSX |
| `lint:fix` | `eslint . --ext ts,tsx --fix` | Lint with auto-fix |
| `seed` | `tsx src/scripts/seedData.ts` | Seed DB (uses service role key; dev/script only) |
| `type-check` | `tsc --noEmit` | Type-check only |

### 3.2 Vite Configuration (Security & Build)

- **Base path:** `/` (root).
- **Alias:** `@` → `./src` for imports.
- **Production:**
  - **Minification:** Terser; `drop_console` and `drop_debugger` in production.
  - **Source maps:** `hidden` in production (available for debugging, not exposed by default).
  - **Chunk splitting:** Separate vendor chunks (e.g. `react-vendor`, `supabase-vendor`, `chart-vendor`, `ui-vendor`) for caching and smaller payloads.
- **Target:** `es2015` for broad support.
- **Assets:** Inline limit 4KB; CSS code splitting enabled.
- **Optimize deps:** Pre-bundles React, React DOM, React Router, Supabase client.

### 3.3 Vercel Deployment

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Routes:**
  - `/assets/*` and static extensions (e.g. `.js`, `.css`, images, fonts): long-lived immutable cache.
  - `/index.html` and catch-all `(.*)` → `index.html` with no-cache headers (SPA).
- **Security note:** No server-side rendering; all auth and data access are client → Supabase. No secrets should be embedded in client bundles; only `VITE_*` env vars are inlined at build time.

---

## 4. Application Segments & Architecture

### 4.1 High-Level Structure

```
src/
├── App.tsx                 # Router, AuthProvider, route definitions
├── main.tsx                # React root, ErrorBoundary, Toaster, unhandledrejection handling
├── index.css               # Global styles (Tailwind)
├── contexts/
│   └── AuthContext.tsx     # Auth state, session, profile, signIn/signOut/refreshProfile
├── components/
│   ├── ProtectedRoute.tsx  # Role-based route guard
│   ├── OnboardingTour.tsx  # Guided tour (Joyride)
│   ├── admin/              # Admin-only UI (UserManagement, TrainerPerformance, etc.)
│   ├── dashboard/          # Role-specific dashboards + DataRefresh
│   └── ...                 # Shared UI, forms, modals
├── pages/
│   ├── Login.tsx           # Public
│   ├── SignUp.tsx          # Public
│   ├── ManagerDashboard.tsx
│   ├── TrainerDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── ExecutiveDashboard.tsx
│   ├── Settings.tsx
│   └── AssessmentForm.tsx  # Manager: new assessment
├── lib/
│   └── supabase.ts        # Supabase client singleton (anon key, sessionStorage)
├── utils/                  # Data access, business logic, sanitization, AI
├── hooks/                  # useAuth, useAutoSave, useDebounce
├── types/
│   └── index.ts           # Shared types, assessment structure
├── constants/
│   └── featureFlags.ts    # Feature flags (e.g. peer/leaderboard visibility)
└── scripts/
    └── seedData.ts        # Dev/seed only; uses service role key
```

### 4.2 Roles & Route Matrix

| Route | Allowed Roles | Description |
|-------|----------------|-------------|
| `/login` | Public | Login page |
| `/signup` | Public | Sign up |
| `/manager/dashboard` | manager | Manager dashboard |
| `/manager/assessment/new` | manager | New assessment form |
| `/trainer/dashboard` | trainer | Trainer performance dashboard |
| `/admin/dashboard` | admin | Admin dashboard (tabs: overview, trainer performance, user management, etc.) |
| `/executive/dashboard` | admin | Executive view |
| `/settings` | admin, manager, trainer | User settings |
| `/` | — | Redirect to `/login` |
| `/manager`, `/trainer`, `/admin` | — | Redirect to respective `/.../dashboard` |

**Enforcement:** `ProtectedRoute` checks `useAuthContext()` (user + profile); if no user → redirect to `/login`; if profile.role not in `allowedRoles` → redirect to role-specific dashboard or login.

### 4.3 Segment Summary (Security View)

| Segment | Owner | Main Data | Risk Focus |
|---------|--------|-----------|------------|
| Login / SignUp | Public | Credentials (Supabase Auth) | Credential handling, rate limiting (Supabase), session fixation |
| Manager | manager | Assessments created, eligible trainers, recommendations | Access to trainer list, assessment CRUD (RLS) |
| Trainer | trainer | Own assessments, performance, goals, badges | Data isolation (RLS: trainer_id = auth) |
| Admin | admin | All profiles, all assessments, user CRUD, audit log, report templates, assessor-assessee overrides | Privileged access; audit logging; bulk operations |
| Settings | All roles | Profile, preferences | Self-service profile update only (RLS) |

---

## 5. Data Architecture & Database

### 5.1 Schema Overview (Supabase / PostgreSQL)

Core tables:

- **teams** – Team names (id, team_name, created_at).
- **profiles** – Extends `auth.users` (id → auth.users.id), full_name, role (manager | trainer | admin), team_id, reporting_manager_id, timestamps.
- **assessments** – Trainer assessments (trainer_id, assessor_id, assessment_date, six rating dimensions with optional comments, overall_comments, timestamps). Constraint: trainer_id ≠ assessor_id.
- **audit_logs** (optional migration) – user_id, action_type, target_type, target_id, details (JSONB), ip_address, created_at.
- **assessor_assessee_overrides** (optional migration) – Admin-defined allow/block overrides for assessor–assessee pairs.

Additional optional schema (gamification, etc.) may exist via separate SQL files (e.g. `supabase-gamification.sql`).

### 5.2 Row Level Security (RLS)

- RLS is **enabled** on core tables (teams, profiles, assessments) and on audit_logs where present.
- Representative policies (see project SQL for full set):
  - **Teams:** SELECT for all; INSERT/UPDATE/DELETE for admins only.
  - **Profiles:** SELECT own; managers see team/reporting profiles; admins see all. UPDATE own; admins can update all.
  - **Assessments:** Trainers see own (trainer_id = auth.uid()); managers see own created (assessor_id = auth.uid()); admins see all. Create/update/delete per role (managers create; admins can update; etc.).
- **Triggers:** e.g. `prevent_self_report_assessment` blocks managers from assessing direct reports; `update_updated_at_column` maintains timestamps.

**Security implication:** All data access is authorized at the database layer via RLS. The client never receives data the RLS policies forbid.

### 5.3 Client-Side Data Access

- Single Supabase client (`src/lib/supabase.ts`) created with **anon** key.
- Auth state and tokens stored in **sessionStorage** (custom storage adapter), not localStorage, to reduce persistence of tokens.
- All table access from the app goes through Supabase client (`.from('profiles')`, `.from('assessments')`, etc.) and is subject to RLS and JWT from Supabase Auth.

---

## 6. Authentication & Authorization

### 6.1 Authentication (Supabase Auth)

- **Method:** Email + password.
- **Flow:** PKCE (`flowType: 'pkce'` in supabase client).
- **Session:** Stored in sessionStorage; auto-refresh enabled; `detectSessionInUrl` for OAuth/callback if ever used.
- **Profile:** After login, app fetches `profiles` row by `auth.uid()` and stores in AuthContext; role comes from `profiles.role`.

### 6.2 Authorization

- **Route level:** `ProtectedRoute` allows access only if user is authenticated and `profile.role` is in `allowedRoles`.
- **Data level:** Supabase RLS policies enforce who can SELECT/INSERT/UPDATE/DELETE on each table.
- **UI level:** Role-based rendering (e.g. admin tabs, manager-only assessment form); not a substitute for RLS.

### 6.3 Session & Token Handling

- Tokens live in sessionStorage; cleared on browser close.
- Unhandled rejection handler in `main.tsx` clears Supabase-related keys from sessionStorage on refresh-token-style errors and suppresses related unhandled rejections.
- No custom token storage outside Supabase client configuration.

---

## 7. Information Security & Cybersecurity

### 7.1 Secrets & Environment Variables

- **Build-time (Vite):** Only variables prefixed with `VITE_` are inlined into the client bundle. **Never** put service keys, API secrets, or DB credentials in `VITE_*` unless they are intended to be public (e.g. anon key is designed to be public; service role key is not).
- **Required for app:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Optional (client):** `VITE_AI_ENABLED`, `VITE_AI_PROVIDER`, `VITE_CLAUDE_API_KEY`, `VITE_OPENAI_API_KEY`, `VITE_GAMIFICATION_ENABLED`.
- **Script / backend only (never in client):** `VITE_SUPABASE_SERVICE_ROLE_KEY` (e.g. seed script). Prefer not exposing service role to frontend at all; use a backend or Supabase Edge Functions for privileged operations in production.
- **.gitignore:** `.env`, `.env.local`, `.env.production` so secrets are not committed.

### 7.2 Input Validation & XSS Prevention

- **Centralized sanitization** (`src/utils/sanitize.ts`):
  - `escapeHtml`: escapes `&`, `<`, `>`, `"`, `'`.
  - `sanitizeInput`: strips script tags, event handlers, then escapes HTML.
  - `validateEmail`, `validateUrl`: format checks.
- **Usage:** User-supplied content displayed in the UI should be passed through these helpers where appropriate to mitigate XSS. React’s default escaping plus sanitization reduces risk; avoid `dangerouslySetInnerHTML` with unsanitized user input.

### 7.3 Authentication & Session Security

- Supabase Auth handles password hashing, JWT issuance, and refresh; app does not store passwords.
- Session in sessionStorage reduces exposure compared to long-lived localStorage tokens.
- PKCE used for auth flow where applicable.
- Sign-out clears local state and calls Supabase sign-out; toast shown once from AuthContext to avoid duplicate UX and to clarify single sign-out path.

### 7.4 API Surface & Data Exposure

- **APIs used:** Supabase REST (PostgREST) and Realtime. All authorized by JWT and RLS.
- **No custom backend in production:** No separate API server; therefore no server-side auth middleware beyond Supabase.
- **Anon key:** Designed to be public; security relies on RLS and Auth. Restrict anon key permissions in Supabase (e.g. no direct access to auth.users or service tables).

### 7.5 Third-Party & External Requests

- **Supabase:** All primary data and auth; TLS in transit; validate Supabase project URL and anon key configuration.
- **Anthropic / OpenAI:** Only when AI is enabled and keys are set; requests from browser to provider APIs. API keys are in env (VITE_*), so they are visible in client bundle if used in frontend—prefer a backend proxy for production AI to avoid exposing keys.
- **Vercel:** Hosting and CDN; no direct access to secrets unless configured in Vercel env (build-time only for VITE_*).

### 7.6 Audit & Logging

- **audit_logs table:** Optional; stores user_id, action_type, target_type, target_id, details (JSONB), ip_address, created_at. RLS: admins can SELECT; inserts typically via service role or SECURITY DEFINER function.
- **Client:** No systematic client-side audit trail in this document; sensitive actions (e.g. admin edits, user creation) should be logged server-side or via Supabase (e.g. triggers, Edge Functions).

### 7.7 Dependency & Supply Chain

- Dependencies are from npm (package.json). No inline scripts or unknown CDNs in the default setup.
- Run `npm audit` and address critical/high issues; keep React, Supabase, and Vite (and other key deps) updated for security patches.
- Lockfile (package-lock.json) should be committed for reproducible builds.

### 7.8 Security Recommendations (Summary)

1. **Secrets:** Do not add service role or other high-privilege keys to client; use backend or Edge Functions for privileged operations.
2. **AI keys:** Prefer a backend proxy for Claude/OpenAI so keys are not in the client bundle.
3. **CSP:** Consider a Content-Security-Policy header (e.g. on Vercel) to restrict script sources and inline scripts.
4. **HTTPS:** Enforce HTTPS in production (Vercel default).
5. **Auth:** Rely on Supabase Auth and RLS; keep route guards and UI in sync with RLS.
6. **Input:** Consistently use sanitization helpers for any user-derived content rendered in the UI.
7. **Audit:** Ensure sensitive admin and data-modification actions are written to audit_logs or equivalent.
8. **Dependencies:** Regular `npm audit` and dependency updates.

---

## 8. Third-Party Integrations & External APIs

| Integration | Purpose | Data Flow | Credential |
|-------------|---------|-----------|------------|
| Supabase | DB, Auth, Realtime | Client ↔ Supabase (TLS) | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY |
| Anthropic (Claude) | AI feedback suggestions | Browser → api.anthropic.com (if AI enabled) | VITE_CLAUDE_API_KEY |
| OpenAI | AI feedback (alternative) | Browser → api.openai.com (if AI enabled) | VITE_OPENAI_API_KEY |
| Vercel | Hosting, build | Git → Vercel; env at build | Vercel project env |

---

## 9. Environment & Secrets Management

- **Development:** `.env` or `.env.local` in project root (gitignored); must include at least `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Production (Vercel):** Set same variables in Project → Settings → Environment Variables; apply to Production (and Preview if desired). No `.env` in repo.
- **Service role key:** Use only in secure contexts (e.g. seed script on trusted machine, or server/Edge Function); never in client bundle.
- **Reference:** See `ENV_VARIABLES_REFERENCE.md` and `.env.example` in the repo for full list and examples.

---

## 10. Appendices

### Appendix A: File Tree (Key Paths)

```
TAPS/
├── index.html
├── package.json
├── vite.config.ts
├── vercel.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── lib/supabase.ts
│   ├── contexts/AuthContext.tsx
│   ├── components/ProtectedRoute.tsx
│   ├── utils/sanitize.ts
│   ├── utils/aiService.ts
│   └── ...
├── supabase-schema.sql
├── supabase-audit-log.sql
├── migrations/
└── ENV_VARIABLES_REFERENCE.md
```

### Appendix B: Environment Variables Quick Reference

| Variable | Required | Client-exposed | Purpose |
|----------|----------|----------------|---------|
| VITE_SUPABASE_URL | Yes | Yes | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Yes | Yes | Supabase anon (public) key |
| VITE_SUPABASE_SERVICE_ROLE_KEY | No (scripts) | Should not be in client | Full access; seed/admin scripts only |
| VITE_AI_ENABLED | No | Yes | Enable AI features |
| VITE_AI_PROVIDER | No | Yes | claude | openai |
| VITE_CLAUDE_API_KEY | If AI + Claude | Yes (if used in client) | Anthropic API key |
| VITE_OPENAI_API_KEY | If AI + OpenAI | Yes (if used in client) | OpenAI API key |
| VITE_GAMIFICATION_ENABLED | No | Yes | Gamification features |

### Appendix C: Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2026 | Initial comprehensive build, stack, and security documentation |

---

*This document is intended for internal use and for information security and cybersecurity review. Keep it updated as the build, stack, or security controls change.*
