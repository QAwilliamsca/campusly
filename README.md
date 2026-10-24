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

**Demo sign-ins** (fictional people, local only — password is `DEMO_PASSWORD` in `.env.example`):

| Email | Role | Sees |
|---|---|---|
| principal@example.com | Owner | Everything in Maple Grove School |
| teacher@example.com | Teacher | Grade 5-A only: students, attendance, exams |
| parent@example.com | Parent | Leo Santos only |
| student@example.com | Student | Own record only |

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
