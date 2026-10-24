# GUIDE.md — How Campusly was built with the Playbook

> **For students.** This is a *reverse-engineering* guide. The app is finished; your job is to walk backwards
> through it, stage by stage, and see how each rule in `PLAYBOOK.md` turned into a file, a test or a decision.
>
> For every stage you get: **what the playbook asks** → **what was done** → **where it lives** (files and the git
> commit) → **try it yourself**. Keep three tabs open: this guide, `PLAYBOOK.md`, and
> [`docs/DECISION_JOURNAL.md`](docs/DECISION_JOURNAL.md) (every question the agent asked the founder).

```bash
git log --oneline --reverse   # the build, one commit per stage group. Check out any commit to see the app at that point.
```

---

## 0. The starting prompt and why the agent asked questions

The founder (your instructor) typed one vague sentence: *"Use the playbook and build a school management
system."* The agent did not start coding. It:

1. Read the whole playbook, then **checked the machine** (no Docker, no Postgres). Facts it can look up, it
   never asks about (§3.2).
2. Ran the **Stage 1 interview**: who's the customer, who logs in, top features, which country.
3. Ran the **Stage 2 decision table**: cut line, stack, how much of the playbook, where the guide lives.
4. Asked about the name, brand, sign-in and pricing unit (Stages 2, 3, 5).

That's **12 questions in 3 rounds**, plus **3 more** later when the red-team review found policy questions (Entry 6), each with options, one recommendation and a reason. The founder overrode
the recommendation twice (name, Google sign-in), and that's normal. Read
[`docs/DECISION_JOURNAL.md`](docs/DECISION_JOURNAL.md) Entries 0–5 before anything else.

> **Lesson:** a vague idea is fine *if your AI agent turns it into decisions instead of guesses*. If an agent
> starts writing code after a one-line prompt, it has guessed the twelve answers above.

---

## Stage map: what was built and what wasn't

| # | Stage | Status | Evidence |
|---|---|---|---|
| 1 | Research | ✅ Done | [`docs/research/SPEC.md`](docs/research/SPEC.md), journal Entry 2 |
| 2 | Decide & lock | ✅ Done | [`docs/DECISIONS.md`](docs/DECISIONS.md), [`docs/PLAN.md`](docs/PLAN.md) |
| 3 | Brand | ✅ Tokens, logo, vocabulary · ⚠️ domain not checked (founder item) | [`src/app/globals.css`](src/app/globals.css) |
| 4 | Architecture | ✅ Local + CI file · ⚠️ real domain/HTTPS not done (no hosting, Stage 11 cut) | commit "Stage 4" |
| 5 | Foundations | ✅ Done, minus queue/notifications/flags (named cuts) | [`src/db`](src/db), [`src/lib`](src/lib) |
| 6 | Vertical slices | ✅ All four modules | [`src/lib/services`](src/lib/services), [`src/app/s/[slug]`](src/app/s/[slug]) |
| 7 | AI layer | ✂️ Cut | PLAN.md |
| 8 | Integrations | ✂️ Cut (fallbacks in place) | PLAN.md |
| 9 | Admin panel | ✂️ Cut | PLAN.md |
| 10 | Quality | ✅ Unit, integration, auth matrix, browser, red-team · ⚠️ deploy gates need Stage 11 | [`tests/`](tests) |
| 11–14 | Deploy, marketing, customers, scale | ✂️ Cut | PLAN.md |

"Cut" never means "forgotten". Each one is named in the PLAN.md cut-line table with what it would take (§2.7
"Cut, never drop").

---

## Stage 1 — Research

**Playbook asks:** interview the founder; one-sentence customer + job; top 3 must-haves; must-never-happen list;
NFRs.

**What was done:** a 4-question interview (journal Entry 2), then a spec draft, NFR sheet and a
**must-never-happen** list.

**Where:** [`docs/research/SPEC.md`](docs/research/SPEC.md). The competitor check was **cut and labelled** (it needs
web research and pricing is below the cut line). Notice it was named, not silently skipped.

**Try it:** read the must-never-happen list. For each of the six items, find the test that proves it doesn't
happen (hint: `grep -rn "another school\|otherSchool\|idempotency\|float" tests/`).

---

## Stage 2 — Decide and lock

**Playbook asks:** a decision table with a recommendation per row, a hard cut line, the flip test, user stories with
acceptance criteria, a phase-1 plan.

**What was done:**
- [`docs/DECISIONS.md`](docs/DECISIONS.md): the 14-row table plus a D-00x entry per decision.
- [`docs/PLAN.md`](docs/PLAN.md): what ships, the **cut-line table**, the data model sketch, the **roles × actions
  table**, and 8 user stories (S-01…S-08) with Given/When/Then acceptance criteria.
- **Flip test:** the pricing unit (per student) is a data row (`plan.limit_kind`, `limit_value`), so switching to
  per-school pricing is a data change, not a code change.

**Try it:** pick acceptance criterion **S-06 AC2** ("double-click Record payment → exactly one payment"). Find its
test in `tests/integration/exams-fees.test.ts` *and* in `tests/e2e/journey.spec.ts`. The acceptance criteria
literally became the tests.

---

## Stage 3 — Name and brand tokens

**Playbook asks:** a founder-approved name; brand reduced to tokens in one file; no raw colours in components;
accessibility baseline.

**What was done:** name "Campusly" (founder's pick), "Calm & trustworthy" direction, all colours as CSS variables
with a dark-mode set, focus ring, 44px tap targets, reduced motion. Vocabulary and banned words are in the
engineering guide §6.

**Where:** [`src/app/globals.css`](src/app/globals.css), [`src/components/Logo.tsx`](src/components/Logo.tsx),
[`src/app/icon.svg`](src/app/icon.svg).

**Try it:** `grep -rn "#[0-9a-fA-F]\{6\}" src --include=*.tsx`. You should find **no** hex colours in components.
Then change `--accent` in one place and watch every screen follow.

---

## Stage 4 — Architecture

**Playbook asks:** one language, one database, one repo; boring libraries; TypeScript strict, linter,
`.env.example`, CI from commit 1; fallbacks so the product runs with **zero keys**.

**What was done:**
- Next.js + TypeScript strict + Drizzle + **PGlite** (real Postgres compiled to WASM, so students need no installs;
  set `DATABASE_URL` for a real server). See D-006 for why.
- [`.env.example`](.env.example) lists every variable, with no values.
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml): typecheck → lint → tests → browser suite → audit → secret scan.
- Fallback table (§9.4) in practice: storage → local disk; mail → dry-run + `mail_log`; Google sign-in → button
  hidden; payments → manual recording.

**Where:** commit `Stage 4: repo scaffold`. Read [`docs/ENGINEERING_GUIDE.md`](docs/ENGINEERING_GUIDE.md) §3 for the
folder pattern.

**Try it:** delete your `.env` entirely and run `pnpm dev`. Everything still works. That's §9.4.

---

## Stage 5 — Foundations (the most important stage to study)

**Playbook asks:** build the parts every feature sits on *before* any feature, with tests.

| Foundation | File | The idea in one line |
|---|---|---|
| **Tenancy wall** | [`src/db/scoped.ts`](src/db/scoped.ts) | Every query through `ctx.s` gets `school_id = …` added automatically |
| Lint ban on raw DB | [`eslint.config.mjs`](eslint.config.mjs) | Feature code *can't* import the unscoped client |
| **One permission function** | [`src/lib/can.ts`](src/lib/can.ts) | `can(member, action, resource)`; "own" grants fail closed |
| Visibility filter | `loadStudentFor` in [`students.ts`](src/lib/services/students.ts) | Can't see it → "not found", same as a wrong ID |
| Human codes | [`src/db/codes.ts`](src/db/codes.ts) | `STU-0001` from an atomic counter, never timestamps |
| Audit | [`src/db/audit.ts`](src/db/audit.ts) | One row per mutation: who, what, before/after |
| Mail | [`src/lib/mail.ts`](src/lib/mail.ts) | One `sendMail()`; dry-run; addresses masked in logs |
| Files | [`src/lib/files.ts`](src/lib/files.ts) | Magic-byte type check, safe names, signed 5-minute URLs |
| Validation | [`src/lib/validation.ts`](src/lib/validation.ts) | Zod, `.strict()` (unknown fields rejected), length limits |
| Errors | [`src/lib/errors.ts`](src/lib/errors.ts), [`src/lib/run.ts`](src/lib/run.ts) | Friendly message + reference ID; details only in logs |
| Money & time | [`src/lib/money.ts`](src/lib/money.ts), [`src/lib/time.ts`](src/lib/time.ts) | Integer minor units; "today" in the school's timezone |
| Auth | [`src/lib/auth.ts`](src/lib/auth.ts) | Better Auth (never hand-rolled crypto), rate-limited, 30-day rolling sessions |

**Test-first, for real:** the unit tests were written first and run red (`4 failed`), then the code made them
green (`18 passed`). Same for integration (`5 files failed` → `119 passed`). See the commit messages.

**Try it:**
1. Open `tests/unit/money.test.ts`. Why is `toMinor("0.29","USD")` a test? (Run `0.29 * 100` in a JS console.)
2. Open `tests/unit/time.test.ts`. At 02:30 UTC on 1 March, what is "today" in New York? Why does attendance care?

---

## Stage 6 — Vertical slices

**Playbook asks:** one complete slice at a time (schema → service → page → tests), designed empty/loading/error
states, verified in a real browser.

**What was done:** four modules, each following the same pattern:

```
schema (src/db/schema.ts)
  → service: validate → can() → scoped query → audit   (src/lib/services/<module>.ts)
  → server action: read named fields → call service      (src/app/s/[slug]/actions.ts)
  → page with empty state + errors                       (src/app/s/[slug]/<module>/page.tsx)
  → integration test + authz-matrix rows + browser check
```

| Module | Service | Notable rule it shows |
|---|---|---|
| Students & classes | `students.ts`, `classes.ts` | Plan limit enforced *inside* the code-counter lock; optimistic locking on edit |
| Attendance | `attendance.ts` | Upsert on (student, date) means saving twice never duplicates |
| Exams | `exams.ts` | Report card never shows NaN; unscored ≠ zero |
| Fees | `fees.ts` | Invoice row locked (`FOR UPDATE`) so parallel payments can't overpay; idempotency key for double clicks |

**Verified in a real browser** with the seeded record "Maple Grove School" (`pnpm seed`), in light and dark, at 375px.

**Try it:** sign in as `teacher@example.com`. Try opening `/s/maple-grove-school/fees` directly. Then sign in as
`parent@example.com`, copy Leo's student URL, and try changing the ID to another student's.

---

## Stage 10 — Quality

**Playbook asks:** all test layers, an authorization matrix, browser checks, and a red-team pass, with gates proven
by evidence.

| Layer | Where | Count |
|---|---|---|
| Unit | `tests/unit/` | 20 |
| Integration (real Postgres) | `tests/integration/` | 39 |
| **Authorization matrix** | `tests/integration/authz-matrix.test.ts` | 71 |
| Browser (production build) | `tests/e2e/` | 23 |

**Gate demonstrated:** "an authorization test fails when a visibility filter is removed." The agent deliberately
let teachers see every student and re-ran the tests: **2 failed**. With the filter restored: **119 passed**.

**Bugs the tests caught before any user saw them** (each became a rule in
[`docs/INCIDENT_RULES.md`](docs/INCIDENT_RULES.md)):
1. Document list answered "empty" instead of "not found" for another school's student (authz matrix).
2. Forbidden pages returned HTTP **200** because `loading.tsx` made the route stream (browser suite).
3. The fees page was 669px wide on a 375px phone because `sr-only` labels escaped the table's scroll box (browser suite).

**Red-team pass (§15.3):** a *separate* reviewer agent was asked to list every way to abuse the app without fixing
anything. Its findings and what happened to each are in the section below.

| # | Severity | Finding | Outcome |
|---|---|---|---|
| 1 | High | Invite email binding bypassable: sign-up never proved email ownership | **Fixed** (founder chose "require verified email", D-010). Test: `redteam.test.ts`, e2e "unverified accounts cannot sign in" |
| 2 | High | Admins could mint admins; nobody could be removed | **Fixed** (founder: owner-only admins + removal, D-011). Members page has Remove |
| 3 | Medium | Open redirect via `/sign-in?next=/%09/evil.com` (tab stripped by the browser → `//evil.com`) | **Fixed**: `safeNext` uses the URL parser. Tests: `tests/unit/redirect.test.ts` + e2e |
| 4 | Medium | Unlimited schools per account (quota farming), no storage cap | **Fixed** (founder: 3 schools, 500 MB, D-012). `plan.storage_mb` added by migration `0001` |
| 5 | Medium | Mail log stored reset/invite links; sink page had no gate besides NODE_ENV | **Fixed**: sink is opt-in (`MAIL_SINK=1`), bodies redacted otherwise |
| 6 | Medium | Changing currency after invoicing rescaled money | **Fixed**: currency locked once invoices exist; payments parse in the invoice's currency |
| 7 | Medium | Rate limit keyed on a spoofable `x-forwarded-for` | **Deferred to Stage 11** (depends on the proxy); written in RUNBOOK |
| 8 | Low | Account squatting; no password-reset UI; reset kept old sessions | **Fixed**: verification (D-010), `/forgot-password` + `/reset-password`, sessions revoked on reset |
| 9 | Low | Revoke vs accept race | **Fixed**: the claim also checks `revoked_at IS NULL` (race not unit-testable; reviewed) |
| 10 | Low | Idempotency key reused on another invoice silently "succeeded" | **Fixed**: refused with a clear message. Test in `redteam.test.ts` |
| 11 | Low | Amounts above 2³¹ minor units crashed with a generic error | **Fixed**: validation message "Too large" |
| 12 | Low | Inviter name unbounded in invite emails | **Fixed**: names trimmed to 100 server-side; invite-volume limit deferred to Stage 8 (real email) |
| 13 | Low | Signed file links work for anyone holding them for 5 minutes | **Accepted**: standard signed-URL design; `nosniff` + `attachment` prevent XSS. Documented |

**How it was handled:** every finding became a **failing test first** (9 integration + 1 unit file red), then the
fix (130 green). The three findings that changed product behaviour went to the founder (journal Entry 6).

**Not demonstrated (needs Stage 11):** "broken build refused by smoke step" and "broken screen auto-rolls back".
Both need a deploy pipeline, which is below the cut line. CI will refuse a broken build once the repo is on GitHub.

---

## Stages 7–9, 11–14: below the cut line

Read the cut-line table in [`docs/PLAN.md`](docs/PLAN.md). The code is already shaped for them:
- **Stage 8:** `sendMail()` is the only mail path, so adding a provider is one file.
- **Stage 11:** `/api/health` exists for smoke checks; migrations apply on boot; `DATABASE_URL` switches to real Postgres.
- **Stage 12:** plans and limits already live in data (`plan` table), and the limit message already says "Upgrade".

---

## How to talk to an AI agent: what this build teaches

1. **Give it the rules first** (the playbook), then the idea. Rules make it ask the right questions.
2. **Expect questions, in rounds, with a recommendation each.** "What do you want?" with no options is a bad
   question; "A or B, I recommend A because…" is a good one.
3. **Know which decisions are yours** (anything a customer notices) and which are the agent's (technical). See
   journal Entry 5.
4. **Ask for evidence, not announcements.** Every claim here has a number: 130 tests, 23 browser tests, 2 tests
   red when a filter was removed, 669px → 375px.
5. **Make it write things down.** Next session, it has forgotten everything except the files.

## Exercises

1. **Add a role check:** let teachers *view* (not edit) fees for their classes. Update `GRANTS`, the PLAN.md
   table, `can.test.ts`, and the authz matrix *first*, and watch them fail before you change the code.
2. **Add a field:** a student's guardian phone number. What does §20.2 say about phone formats? Which file holds
   validation? Where does the audit row get it?
3. **Break the wall:** in a service, replace one `ctx.s.findOne` with a raw query. What stops you? (`pnpm lint`)
4. **Write the decision table row** you'd need before building a Timetable module. What would you ask the founder?
