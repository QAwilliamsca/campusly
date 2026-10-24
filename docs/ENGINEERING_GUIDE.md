# ENGINEERING_GUIDE.md — Campusly

How the system works. Answers "where does X go?" for any X. (Playbook §22.4 skeleton.)

## 1. Decisions summary
See [`DECISIONS.md`](DECISIONS.md) — **do not reopen without the owner**. In one line: multi-school SaaS; four modules
(students & classes, attendance, exams, fees); five roles; Next.js + Drizzle + PGlite; generic locale; email+password
(+ Google when keys exist).

## 2. Hosts & environments
Phase 1 runs locally only (Stage 11 is below the cut line). One app serves everything:

| Path | What |
|---|---|
| `/` | Marketing placeholder |
| `/sign-in`, `/sign-up`, `/invite/[token]` | Auth |
| `/schools` | School picker + create (pre-tenant) |
| `/s/[slug]/…` | One school's workspace (path-based tenancy) |
| `/api/auth/*` | Better Auth |
| `/api/files/[id]` | Signed downloads |
| `/api/health` | Smoke check |
| `/dev/mail` | Dry-run mail sink — **404 unless `MAIL_SINK=1`** (`pnpm dev` and the e2e server set it) |
| `/forgot-password`, `/reset-password` | Password reset (sessions revoked on reset) |

Environments: **local** (`.data/pglite`), **e2e** (`.data/e2e`, rebuilt every test run), **production** (set `DATABASE_URL`).
Separate databases per environment; tests never touch dev data.

## 3. Repo layout
```
src/db/            schema, migrations runner, scoped client, codes, audit, global reads  ← only place with raw DB
src/lib/           can(), money, time, files, mail, validation, errors, context, session, auth
src/lib/services/  business logic, one file per module — every rule lives here, UI stays thin
src/app/           pages + server actions (thin: parse FormData → call service → revalidate)
src/components/    shared UI (ActionForm, NavLinks, ui.tsx primitives)
tests/unit         pure logic        tests/integration  services on a real in-memory Postgres
tests/e2e          Playwright against a production build
scripts/seed.ts    demo preset       drizzle/  generated SQL migrations
```
**Module pattern:** schema table → service in `src/lib/services/<module>.ts` (validate with Zod → `can()` → scoped
client → audit) → actions in `src/app/s/[slug]/actions.ts` → page in `src/app/s/[slug]/<module>/page.tsx` → tests
in all three layers + a row in the authorization matrix.

## 4. Tenancy rule
- Every tenant table has `school_id NOT NULL` + FK + index. Unique constraints are per school (`(school_id, code)`).
- Feature code reads and writes **only** through `ctx.s` (the scoped client, `src/db/scoped.ts`), which adds
  `school_id = <current school>` to every query.
- `import … from "@/db/client"` is **lint-banned** outside an explicit allow-list (`eslint.config.mjs`).
- Single-record lookups for a role with "own" access go through `loadStudentFor(ctx, id, action)`, which returns
  **not found** when the user can't see the record — same answer as a wrong ID, so existence never leaks.

```ts
// ✅ inside a service
const cls = await ctx.s.findOne(schoolClass, eq(schoolClass.id, classId)); // filtered to ctx.school automatically
// ❌ never in feature code
const db = await getDb(); db.select().from(schoolClass)…                // lint error: tenancy wall
```

## 5. Permissions
- Roles: `owner`, `admin`, `teacher`, `parent`, `student` (`src/db/schema.ts`).
- One function: `can(member, action, resource?)` in `src/lib/can.ts`. Grants are `all` or `own`; `own` needs a
  resource (`classTeacherId`, `guardianUserIds`, `studentUserId`) and **fails closed** without one.
- To add an action: add it to the `Action` union and `GRANTS`, update the table in `docs/PLAN.md`, add rows to
  `tests/unit/can.test.ts` and `tests/integration/authz-matrix.test.ts`.

## 6. Brand tokens, vocabulary, tone
- Tokens: `src/app/globals.css` — `:root` is light, `:root[data-theme="dark"]` is dark. `<html data-theme>` is set
  before first paint by `THEME_SCRIPT` in `layout.tsx` (saved choice, else OS), and flipped by `ThemeToggle`.
- **D-014: the sun/moon toggle is fixed top-right on every page.** Any new top bar needs right padding
  (`pr-14`/`pr-16`) so its buttons don't sit under it. `tests/e2e/theme.spec.ts` checks the position. **No raw colours in components** —
  use `bg-accent`, `text-muted`, `card`, `btn-primary`, `input`, `data-table`, `badge` etc.
- Accessibility baked in: text ≥ 4.5:1, `:focus-visible` ring, 44px minimum targets (`min-h-11`), reduced motion.
- **Vocabulary (customer-visible):** School, Class, Student, Teacher, Parent, Member, Invite, Attendance, Exam,
  Marks, Report card, Invoice, Payment. **Avoid:** "tenant", "workspace", "user record", "entity", "org".
- Tone: plain, calm, short. Errors say what to do next ("Upgrade to admit more.").

## 7. Data conventions
- Timestamps `timestamptz` in UTC. Calendar dates (`attendance.on_date`, `exam.held_on`, `invoice.due_on`) are the
  **school-local date**, computed with `todayIn(school.timezone)`.
- Money: integer minor units + ISO currency (`toMinor("12.50","USD") → 1250`), parsed as strings — never floats.
- Human codes: `STU-0001`, `INV-0001` via `nextCode()` — atomic upsert on `counter`, row-locked till commit.
- Optimistic locking: `student.version`; stale saves get "Someone else changed this student."
- Audit: `audit(s, actor, action, entity, id, {before, after})` on every mutation. IDs and plain fields only.
- Deletes: none in phase 1 (archive/delete flows are below the cut line).

## 8. Queue
Not built — no phase-1 feature needs background work (cut, see PLAN.md). First async job → add pg-boss on the same
Postgres; jobs must carry `school_id` and be idempotent.

## 9. AI layer
Not built (Stage 7 below the cut line).

## 10. Testing
| Layer | Command | Notes |
|---|---|---|
| Unit | `pnpm test` (with integration) | `tests/unit` — can(), money, time, files |
| Integration | `pnpm test` | Fresh in-memory Postgres per file (`connect()` with no dir) |
| Authorization matrix | `pnpm test` | `tests/integration/authz-matrix.test.ts` |
| Browser | `pnpm test:e2e` | Builds prod, seeds `.data/e2e`, port 3100. See `tests/README.md` |

Write the test first and watch it fail. Test gotchas: `tests/README.md`.

## 11. Definition of done
Playbook §20.1 — every box. In short: tests first and green, authz rows added, empty/loading/error/no-permission
states, light + dark, 375/768/1280 without horizontal scroll, keyboard + labels, no console errors, browser check
added, audit rows written, diff self-reviewed, report lists what wasn't tested.

## 12. Deploy
Not built (Stage 11 below the cut line). `pnpm build && pnpm start` runs production locally; set `DATABASE_URL`
and `BETTER_AUTH_SECRET` for anything real.

## 13. Secrets
`.env` (git-ignored) locally; server secrets file in production. `.env.example` lists every variable with no
values. Production refuses to boot without `BETTER_AUTH_SECRET` (`src/lib/secret.ts`). Never print secrets; logs
mask emails (`a***@example.com`).

## 14. Gotchas (dated)
- 2026-10-24 — **Path with spaces:** `new URL(..., import.meta.url).pathname` keeps `%20`; use `path.join(process.cwd(), …)`.
- 2026-10-24 — **PGlite** does not create parent folders, and only one process may open a data folder. Stop
  `pnpm dev` before `pnpm seed`.
- 2026-10-24 — **TypeScript 7** isn't supported by typescript-eslint yet → pinned TS 6.
- 2026-10-24 — **Tailwind v4:** custom classes that `@apply` each other must be `@utility`; `table` clashes with the
  built-in utility (ours is `data-table`).
- 2026-10-24 — **`loading.tsx` turns `notFound()` into HTTP 200** (the route streams). We removed it under
  `/s/[slug]`; nav pending state uses `useLinkStatus` instead.
- 2026-10-24 — **`sr-only` inside a scroll box** escapes it unless the box is `position: relative`; it widened the
  fees page to 669px at 375px.
- 2026-10-24 — **Mail bodies hold tokens.** They're stored only when `MAIL_SINK=1`; otherwise redacted (red-team #5).
- 2026-10-24 — **A form inside a list row unmounts when the row is removed** — its success message goes with it.
  Assert the row's disappearance instead.
- 2026-10-24 — **Server actions + FormData:** read named fields only; never spread FormData into a service
  (services use `.strict()` and would reject framework fields anyway).
