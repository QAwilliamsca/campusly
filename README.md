# Campusly — School Management System

A multi-school SaaS where admins, teachers, parents and students see the same, correct record of each student's
**attendance, marks and fees**, each seeing only what they're allowed to.

Built step by step with an AI agent following the course playbook (`PLAYBOOK.md`, shared by your instructor). This repo is a teaching case: read
[`GUIDE.md`](GUIDE.md) for the stage-by-stage walkthrough and [`docs/DECISION_JOURNAL.md`](docs/DECISION_JOURNAL.md)
for every question the agent asked the founder.

## Run it (no Docker, no database install)
Requires Node 22+ and pnpm 10+.
```bash
pnpm install
pnpm seed
pnpm dev
```
Open http://localhost:3000. The database is embedded Postgres ([PGlite](https://pglite.dev)) stored in `.data/`.

## Demo data
`pnpm seed` creates two schools with fictional people. `pnpm seed:reset` wipes local data and starts over (stop
`pnpm dev` first). **Every account's password is `campusly-demo-1`** (`DEMO_PASSWORD` in `.env.example`; local only,
never reuse it on a real deployment).

| Email | Role | What to try |
|---|---|---|
| principal@example.com | Owner of Maple Grove · Admin of Riverside | School picker shows **two schools**. Every screen; invite an **admin** (owner only); remove members |
| admin@example.com | Admin | Everything except inviting admins or removing the owner/admins. Try it: the Admin role is missing from the invite form |
| teacher@example.com | Teacher, Grade 5-A | 6 students; attendance already marked **today**; 4 exams with marks |
| teacher2@example.com | Teacher, Grade 6-B | **Not marked today**; Noah missed Term 1 Maths (left blank, not zero); upcoming Geography exam |
| newteacher@example.com | Teacher, no class | Empty states: "You don't teach any class yet" |
| parent@example.com | Parent of Leo + Mia | **Two children cards**; Mia's fees are partly paid **and overdue** |
| parent2@example.com | Parent of Aisha | One child, fully paid, with a document on file |
| newparent@example.com | Parent, no child linked | Empty state: "No student is linked to your account yet" |
| student@example.com | Student (Leo Santos) | Own record only: 100% attendance, report card, partly paid fees |
| student2@example.com | Student (Aisha Khan) | Own record only: high marks, paid fees |
| riverside@example.com | Owner of Riverside Academy | A second school in **EUR** and **Europe/London**; can never see Maple Grove |

**What's in Maple Grove School (USD, America/New_York):**
- **Classes:** Grade 5-A (6 students), Grade 6-B (5), Grade 7-C (empty, no teacher). Kai Müller is a new admission with no class.
- **Names that test edge cases:** Zoë O'Brien, आरव शर्मा, Mateo García.
- **Attendance:** 20 school days for 5-A and 6-B, with different patterns per student (from 100% down to ~60%).
- **Exams:** 4 exams for 5-A (all marked) and 3 for 6-B (one student unscored, one future exam).
- **Fees:** paid, partly paid, unpaid, overdue (all of 6-B) and one-off invoices (a museum trip, lab materials).
- **Documents:** on Leo (PDF and PNG) and Aisha (PDF).
- **Members:** 2 pending invites. The audit log is already full of real entries.

Email is never really sent. New accounts must verify their email (D-010): open the link from the local mail sink at
http://localhost:3000/dev/mail (enabled by `pnpm dev` via `MAIL_SINK=1`; never set that on a shared server).

## Test it
```bash
pnpm typecheck && pnpm lint
pnpm test        # 130 unit + integration + authorization-matrix tests on a real in-memory Postgres
pnpm test:e2e    # 23 browser tests against a production build (first run: pnpm exec playwright install chromium)
```

## Features (Phase 1)
- **Schools & members:** sign up with email verification and password reset, create up to 3 schools, invite teachers/parents/students (admins: owner only) by link (single-use, 7-day expiry, bound to a verified email), remove members.
- **Students & classes:** admissions with automatic codes (`STU-0001`), class lists, teacher assignment, documents (PDF/PNG/JPG, signed download links), edit with conflict detection.
- **Attendance:** per class per day, in the school's timezone; percentages on every student.
- **Exams & report cards:** marks entry with server-side range checks; report cards with per-exam and overall percentages.
- **Fees:** bill a class or a student, record payments (double-click safe, no overpaying), paid/partial/overdue status, any currency.
- **Audit log:** every change, who made it, before/after.

Not in Phase 1 (deliberately, see [`docs/PLAN.md`](docs/PLAN.md#what-does-not-ship-cut-line-named--playbook-73)): real email sending, payment gateway, 2FA, deployment/backups, marketing site, AI features.

## Docs
| File | What |
|---|---|
| [`GUIDE.md`](GUIDE.md) | Student walkthrough: each playbook stage → what was done → where it is in the code |
| [`docs/DECISION_JOURNAL.md`](docs/DECISION_JOURNAL.md) | Every question asked of the founder, options, recommendation, answer |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Locked decisions (playbook format) |
| [`docs/PLAN.md`](docs/PLAN.md) | Scope, cut line, data model, roles table, user stories + acceptance criteria |
| [`docs/ENGINEERING_GUIDE.md`](docs/ENGINEERING_GUIDE.md) | How the system works, conventions, gotchas |
| [`docs/RUNBOOK.md`](docs/RUNBOOK.md) · [`docs/INCIDENT_RULES.md`](docs/INCIDENT_RULES.md) · [`docs/NOTES.md`](docs/NOTES.md) | Operating, incidents, next steps |
