# Campusly — School Management System

A multi-school SaaS where admins, teachers, parents and students see the same, correct record of each student's
**attendance, marks and fees**, each seeing only what they're allowed to.

Built step by step with an AI agent following [`PLAYBOOK.md`](PLAYBOOK.md). This repo is a teaching case: read
[`GUIDE.md`](GUIDE.md) for the stage-by-stage walkthrough and [`docs/DECISION_JOURNAL.md`](docs/DECISION_JOURNAL.md)
for every question the agent asked the founder. [`CLAUDE.md`](CLAUDE.md) briefs your AI assistant automatically.

## Get started (no coding knowledge needed)

**Live demo:** https://campusly.13-127-195-244.sslip.io (sign in with any demo account below).

**1. Get the code: keep the git history** (the commits *are* the lesson, so avoid "Download ZIP"). The repository is
**public**: https://github.com/shivavashishtha/campusly. You need only a free GitHub account; no invitation is needed.
- **Fork it first:** on the repo page click **Fork → Create fork**. You get your own copy at
  `github.com/<your-username>/campusly`, which you can push your own branches to.
- **Then clone your fork:** install [GitHub Desktop](https://desktop.github.com), open **your fork's** page and click
  **Code → Open with GitHub Desktop**. Or ask Claude Code: *"Clone https://github.com/&lt;your-username&gt;/campusly into a folder"*.

**2. Install Node.js once:** download the **LTS** version (22 or newer) from [nodejs.org](https://nodejs.org) and click through the installer.

**3. Open the folder in Claude Code and send this first message:**
> Read this project's README, GUIDE.md and docs folder. Explain what the app does, how it's organised, and how it
> follows the playbook. Then set it up and run it for me.

Claude will install everything and start the app. Then open **http://localhost:3000** and sign in with a demo
account below.

**Prefer the browser only?** On the repo page click **Code → Codespaces → Create codespace**. GitHub installs
everything in the cloud and opens the running app in a new tab (uses your free Codespaces hours).

<details>
<summary>Doing it by hand (for developers)</summary>

```bash
corepack enable   # once, gives you pnpm
pnpm install
pnpm dev          # seeds demo data automatically, then serves http://localhost:3000
```
No Docker, no database install: the database is embedded Postgres ([PGlite](https://pglite.dev)) stored in `.data/`.
Works on macOS, Windows and Linux.
</details>

## Demo data
`pnpm dev` creates two schools with fictional people the first time it runs. `pnpm seed:reset` wipes local data and
starts over (stop `pnpm dev` first). **Every account's password is `campusly-demo-1`** (`DEMO_PASSWORD` in `.env.example`; local only,
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
http://localhost:3000/dev/mail (switched on for `pnpm dev` by `.env.development`; never set `MAIL_SINK=1` on a shared server).

## Test it
```bash
pnpm typecheck && pnpm lint
pnpm test        # 130 unit + integration + authorization-matrix tests on a real in-memory Postgres
pnpm test:e2e    # 25 browser tests against a production build (first run: pnpm exec playwright install chromium)
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
| [`PLAYBOOK.md`](PLAYBOOK.md) | The operating manual the whole build followed |
| [`CLAUDE.md`](CLAUDE.md) | Briefing your AI assistant reads automatically: rules, commands, how to keep the journal |
| [`GUIDE.md`](GUIDE.md) | Student walkthrough: each playbook stage → what was done → where it is in the code |
| [`docs/DECISION_JOURNAL.md`](docs/DECISION_JOURNAL.md) | Every question asked of the founder, options, recommendation, answer |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Locked decisions (playbook format) |
| [`docs/PLAN.md`](docs/PLAN.md) | Scope, cut line, data model, roles table, user stories + acceptance criteria |
| [`docs/ENGINEERING_GUIDE.md`](docs/ENGINEERING_GUIDE.md) | How the system works, conventions, gotchas |
| [`docs/RUNBOOK.md`](docs/RUNBOOK.md) · [`docs/INCIDENT_RULES.md`](docs/INCIDENT_RULES.md) · [`docs/NOTES.md`](docs/NOTES.md) | Operating, incidents, next steps |
