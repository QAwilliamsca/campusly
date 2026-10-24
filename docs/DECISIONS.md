# DECISIONS.md — Do not reopen without the owner

Locked decisions for Campusly, in playbook §22.1 format. The conversation that produced them is in
[`DECISION_JOURNAL.md`](DECISION_JOURNAL.md).

## Decision table (playbook §22.2)

| # | Decision | Agent recommendation (+ one reason) | Founder choice | Notes |
|---|---|---|---|---|
| 1 | Product shape | Web app (responsive) — works on phones without an app store | Web app | — |
| 2 | First customer segment | Multi-school SaaS — matches tenancy design | Multi-school SaaS | Each school = one workspace |
| 3 | Phase-1 scope | Students & classes, attendance, exams | + Fees; all 4 roles | See PLAN.md stories |
| 4 | Cut line | Stages 7–9, 11–14 below the line | Accepted | Listed in PLAN.md |
| 5 | Stack | Next.js + TypeScript + Drizzle + PGlite (embedded Postgres) | Accepted | Machine has no Docker |
| 6 | AI stance | No AI in phase 1 | Accepted (via depth choice) | Stage 7 cut |
| 7 | Hosting & region | Local only in phase 1 | Accepted (via depth choice) | Stage 11 cut |
| 8 | Auth methods, 2FA | Email+password, 2FA later | Email+password + Google | Google hidden until keys exist |
| 9 | Pricing unit & plans | Per student, prices later | Accepted | Plan = data row, limit enforced |
| 10 | Price visibility | Decide in Stage 12 | Deferred (cut) | — |
| 11 | Languages / locale | India defaults | Generic / international | Per-school currency + timezone |
| 12 | Compliance | — | None specific (generic) | Must-never-happen list still applies |
| 13 | Timeline | One build session, slice by slice | Accepted | — |
| 14 | Flip test | Pricing unit (per student ↔ per school) | Accepted | `plan.limit_kind` column; flip = data change |

---

## D-001 — Customer is a multi-school SaaS
Date: 2026-10-24   Decided by: Founder   Stage: 1
Decision: Campusly is sold to many schools; each school is an isolated workspace.
Options considered: A) multi-school SaaS B) single school C) school chain
Reason: Teaches the playbook's tenancy, roles and SaaS foundations.
Affects: Every table carries `school_id`; scoped client; authorization matrix tests.
Reopen only if: a real buyer is a chain needing cross-branch data.

## D-002 — Phase-1 roles: owner/admin, teacher, parent, student
Date: 2026-10-24   Decided by: Founder   Stage: 1
Decision: All four user types sign in. Parents and students are read-only.
Reason: Founder chose all four.
Affects: `can()`, visibility filters, invitation flow (parent/student invites linked to a student).

## D-003 — Phase-1 modules: Students & classes, Attendance, Exams & report cards, Fees
Date: 2026-10-24   Decided by: Founder   Stage: 1–2
Decision: All four ship. Fees records payments manually; no live gateway.
Reason: Founder: these are what the first schools demand.
Affects: PLAN.md slice order.

## D-004 — Locale: generic / international
Date: 2026-10-24   Decided by: Founder   Stage: 1
Decision: No country-specific formats. Each school sets currency (ISO 4217) and timezone (IANA).
Reason: Founder chose generic.
Affects: money stored as integer minor units + currency; dates stored UTC, shown in school timezone.

## D-005 — Implement playbook stages 1–6 and 10
Date: 2026-10-24   Decided by: Founder   Stage: 2
Decision: Code implements stages 1–6 and 10. Others are documented below the cut line.
Reason: Keeps the codebase teachable while covering the testing stage.

## D-006 — Stack: Next.js + TypeScript + Drizzle + PGlite
Date: 2026-10-24   Decided by: Founder   Stage: 2/4
Decision: Next.js (App Router), TypeScript strict, Drizzle ORM, PGlite (Postgres compiled to WASM, in-process),
Better Auth, Zod, Tailwind, Vitest, Playwright. `DATABASE_URL` set → real Postgres instead.
Options considered: A) PGlite B) Docker Postgres C) SQLite
Reason: Real Postgres semantics with zero installs for students.
Reopen only if: PGlite blocks something (e.g. concurrent processes) in a measured way.

## D-007 — Name: Campusly; brand: Calm & trustworthy  ⟶ brand part superseded by D-013
Date: 2026-10-24   Decided by: Founder   Stage: 3
Decision: Product name "Campusly". Deep-blue accent, neutral greys, clean sans-serif.
Note: domain/trademark availability NOT checked (open founder item).

## D-008 — Auth: email + password + Google
Date: 2026-10-24   Decided by: Founder   Stage: 5
Decision: Email+password and Google sign-in. Google button hidden until founder adds OAuth keys
(agent never creates OAuth apps, §2.4). 2FA below the cut line.

## D-009 — Pricing unit: per student, prices decided later
Date: 2026-10-24   Decided by: Founder   Stage: 2
Decision: Plans are data rows with a student limit. No billing code in phase 1.
Affects: `plan` table; student-create enforces limit with a clear upgrade message.

## D-010 — Email must be verified before sign-in and before accepting an invite
Date: 2026-10-24   Decided by: Founder   Stage: 10 (red-team #1)
Decision: Unverified accounts can't sign in or accept invites. Locally the verification link is in the mail sink.
Reason: Without it, an invite's email binding can be bypassed by anyone holding the link.
Affects: auth config, acceptInvite, sign-up screen, e2e helpers.

## D-011 — Only the owner invites admins; staff can remove members
Date: 2026-10-24   Decided by: Founder   Stage: 10 (red-team #2)
Decision: Admin invites are owner-only. Owner removes anyone but themself; admins remove non-staff members.
Reason: A departed admin must be able to lose access; admins must not mint admins.

## D-012 — Limits: 3 owned schools per account, 500 MB of documents per school
Date: 2026-10-24   Decided by: Founder   Stage: 10 (red-team #4)
Decision: Creating a 4th owned school is refused; uploads beyond the plan's storage are refused with a clear message.
Storage limit lives on the plan row (`plan.storage_mb`) so pricing can change it without code.

## D-013 — Brand kit: "Evergreen" (replaces D-007's "Calm & trustworthy")
Date: 2026-10-24   Decided by: Founder   Stage: 3 (reopened by the founder, §21.14)
Decision: Deep teal-green accent (#0b6e5f; dark #5fd3bd), soft sage neutrals, Fraunces headings, Nunito Sans body,
18px cards and 12px controls. Name "Campusly" unchanged.
Options considered: 1) Ink & Paper (agent's recommendation) 2) Evergreen 3) Sunrise 4) Slate & Violet, all shown
as real screens at /dev/brand, light and dark, each passing WCAG AA.
Reason: Founder's choice. Friendly and natural; feels like a school rather than a bank.
Impact (measured): tokens in globals.css, two fonts in layout.tsx, favicon colour. Zero component changes.

## D-014 — Theme toggle: a sun/moon button always top-right on every page
Date: 2026-10-24   Decided by: Founder   Stage: 3
Decision: Every page shows a sun/moon toggle fixed to the top-right corner. The first visit follows the OS setting;
a click switches and is remembered in that browser.
Affects: root layout (toggle + pre-paint script), dark tokens keyed on `<html data-theme>`, header right padding.
Reopen only if: the founder changes it.

## D-015 — Public demo runs in demo mode: sign-up closed, demo accounts listed
Date: 2026-10-24   Decided by: Agent default (recommended option; founder may overturn)   Stage: 8/11
Decision: `DEMO_MODE=1` on the server closes sign-up (UI and API) and lists the seeded accounts on the sign-in page.
Reason: D-010 needs a verified email and there is no mail provider yet; this keeps red-team #1 closed on a public site.
Known risk: anyone can sign in as a demo user and edit demo data. `sudo campusly-reset-demo` restores it.

## D-016 — (Superseded by D-017) Hosting: one AWS Lightsail server in Mumbai, free sslip.io HTTPS address, embedded database
Date: 2026-10-24   Decided by: Agent default (recommended options; founder may overturn)   Stage: 11
Decision: Ubuntu 24.04 Lightsail instance (2 GB plan) in ap-south-1 with a static IP; Caddy for automatic HTTPS on
`campusly.<ip-with-dashes>.sslip.io`; PGlite data in `/var/lib/campusly` (single app process, fine for a demo).
Options considered: Lightsail · EC2 + Docker · App Runner + RDS; PGlite vs managed Postgres.
Reason: lowest monthly cost from the sign-up credit, fewest console screens for a live class, no extra services.
Upgrade path: set `DATABASE_URL` to a Postgres (e.g. Lightsail database) — no code change.
Affects: `deploy/` scripts, docs/DEPLOY_AWS.md.

## D-017 — Hosting moves to one EC2 server (supersedes D-016)
Date: 2026-10-24   Decided by: Founder   Stage: 11
Decision: one EC2 **t3.small** (2 vCPU, 2 GiB) in ap-south-1, Ubuntu **24.04** LTS (not Pro, not 26.04), 20 GiB gp3,
no key pair (browser terminal via EC2 Instance Connect), security group open on 22/80/443, an **Elastic IP**, and
`deploy/ec2-user-data.sh` as user data. Same Caddy + sslip.io + PGlite set-up as D-016.
Options considered: keep Lightsail (it never served the site) · EC2.
Reason: the founder chose EC2 (the service students will meet in jobs); same scripts, same cost range (~$17/month
plus about $3.60/month for the public IPv4 address), paid from the sign-up credit.
Upgrade path: `DATABASE_URL` to RDS Postgres — no code change.
Affects: `deploy/ec2-user-data.sh`, docs/DEPLOY_AWS.md, guided document Part 13.

## D-018 — The repository is public
Date: 2026-10-24   Decided by: Founder   Stage: 11
Decision: https://github.com/shivavashishtha/campusly is public. Students fork it, then clone their fork.
Reason: students need it without invitations; the server downloads it with no token. Full history was scanned for
secrets before switching (none: demo data only, secrets are generated on the server).
Known risk: anyone can read the code. Nothing secret may ever be committed (CLAUDE.md rules already forbid it).
Reopen only if: commercial code is added.

