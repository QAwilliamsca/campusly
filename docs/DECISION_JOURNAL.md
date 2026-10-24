# Decision Journal — how a vague idea became a spec

> **For students.** This file records every question Claude asked the founder (the instructor) while building
> this School Management System with `PLAYBOOK.md`, in the order it was asked. For each one you'll see:
> **why Claude asked** (which playbook rule forced the question), the **options** offered, **Claude's
> recommendation**, and the **founder's answer**.
>
> Read it to learn the pattern: when you give Claude a vague idea, a good agent doesn't guess the things a
> customer would notice. It asks, one decision at a time, with a recommendation attached.
>
> The formal, locked decisions live in `docs/DECISIONS.md` (playbook §22.1 format). This journal is the
> conversation behind them.

---

## Entry 0: The vague idea (starting point)

**Founder said:** "Utilize the playbook and help me build a school management system. Build the whole
application."

**What Claude noticed was missing.** "School management system" could mean a dozen different products. The
playbook (§1.1) says scope, segment, priorities, stack and pricing belong to the founder, so Claude can't fill
these in alone:

- Who is the customer: one school, or a SaaS sold to many schools?
- Who logs in: admins, teachers, parents, students?
- Which features matter first: attendance, grades, fees, timetable, transport…?
- Which country/locale (currency, phone formats, compliance)?
- What tech stack, given the founder's machine?
- How much of the 14-stage playbook to actually implement?

**What Claude did before asking anything (playbook §3.2: "never ask a question you can answer yourself").**
- Read the whole playbook.
- Checked the machine: Node 22 and pnpm installed; **no Docker, no Postgres, no GitHub CLI**. That
  changes the stack question, so Claude raised it as a decision instead of assuming the playbook's default.

---

## Entry 1: First question batch (sent too early, then withdrawn)

Claude first jumped straight to the Stage 2 decision table (scope, depth, stack, guide format). The founder
didn't answer it. Instead, they asked for this journal and said they would take every decision personally.

**Lesson for students:** Claude skipped Stage 1 (Research). The playbook says to *interview the founder about
the customer and the job first* (§6), and only then build the decision table (§7). Claude corrected
course and restarted at Stage 1. That's the next entry.

---
## Entry 2: Stage 1 interview (Research, playbook §6)

**Why Claude asked:** §6 says "Interview the founder… confirm the one customer group and the one job" and
"confirm the top 3 features the first 10 customers will demand." These are founder-owned (§1.1: product
scope, segment, priorities).

| # | Question | Options offered | Claude recommended | Founder chose |
|---|---|---|---|---|
| 2.1 | Who is the customer? | SaaS for many schools · One single school · School chain | **SaaS for many schools**: matches the playbook's tenancy and sellable-SaaS design | **SaaS for many schools** |
| 2.2 | Who logs in during Phase 1? (multi-select) | Admin/principal · Teachers · Parents · Students | Admin + Teachers | **Admin, Teachers, Parents, Students** (all four) |
| 2.3 | Top 3 features the first 10 schools will demand? (multi-select) | Students & classes · Attendance · Exams & report cards · Fees | Students & classes, Attendance, Exams | **All four**, Fees included |
| 2.4 | Which market / locale? | India · USA · Generic/international | India (playbook defaults) | **Generic / international** |

**What Claude did with the answers:**
- **Generic locale:** no country-specific formats. Following §10 ("money as integer minor units + currency")
  and the time rule ("store UTC, display in the user's timezone"), each school stores its own **currency
  code** and **timezone**. This is a technical consequence of the founder's choice, so Claude decided it
  alone (§3.4) and noted it here.
- **Four features and four roles for "top 3":** the founder picked more than the question asked for. The
  playbook's §7.3 says "draw the cut line hard" and §3.8 says to name the cost of extra scope. So Claude
  doesn't silently accept or drop anything; the cost goes into the Stage 2 table as a decision.

**One-sentence customer + job (Stage 1 gate, §6):**
> *Customer:* schools that today run admissions, attendance, marks and fees on paper or spreadsheets.
> *Job:* "Give every school one place where admins, teachers, parents and students see the same, correct
> record of each student's attendance, marks and fees."

---
## Entry 3: Stage 2 decision table, round 1 (Decide & lock, playbook §7)

**Why Claude asked:** §7 says "Every decision the build could stall on is taken by the founder, written with
its reason, before any feature code." This is the only stage where the playbook allows batching questions
(§3.2).

| # | Question | Options offered | Claude recommended (+ reason) | Founder chose |
|---|---|---|---|---|
| 3.1 | **Cut line**: 4 features + 4 roles, each costing roughly one build loop. What's in Phase 1? | Everything · Defer parent/student portals · Defer Fees | **Everything**: parent/student portals are read-only and cheap; Fees records payments manually, with no live gateway (playbook §9.4 fallback) | **Everything** |
| 3.2 | How much of the 14 stages should the code implement? | Stages 1–6 + 10 · All 14 · Stages 1–6 | **1–6 + 10**: a codebase students can follow, plus the testing stage the course teaches | **Stages 1–6 + 10** |
| 3.3 | Stack (machine has Node 22 + pnpm, no Docker/Postgres) | Next.js + embedded Postgres (PGlite) · Next.js + Docker Postgres · Next.js + SQLite | **Embedded Postgres**: keeps the playbook's Postgres, while students need zero installs | **Next.js + embedded Postgres** |
| 3.4 | Where does the student guide live? | Markdown in repo · Repo + shareable doc · .docx | **Markdown in repo**: ships on GitHub with the code | **Markdown in repo** |

**Lesson for students:** look at 3.3. The playbook's default stack assumes Docker. Claude *checked the
machine first*, found Docker missing, and turned that into a decision with a recommendation, instead of
silently installing things or silently deviating from the playbook. That's §3.4: technical differences
Claude may decide alone, but a deviation from the agreed stack goes to the founder.

**Below the cut line (named, not dropped, per §2.7):** Stage 7 AI layer · Stage 8 live integrations (real
email sending, payment gateway, social sign-in) · Stage 9 staff admin console · Stage 11 production deploy,
backups and alerts · Stage 12 marketing site and pricing pages · Stage 13 customer onboarding/import · Stage 14
load testing and cost. Each will get a "what it would take" note in `docs/PLAN.md`.

---
## Entry 4: Name, brand, auth, pricing (Stages 2, 3, 5)

**Why Claude asked:** §8 says the name and brand direction are founder-owned ("never use a name the founder
hasn't approved in any customer-visible place"). §10 lists auth methods and 2FA under 🛑 ASK. The Stage 2
table has a "flip test" row: "name the decision most likely to reverse within a month (usually pricing
unit) and design so the flip costs copy, not code."

| # | Question | Options offered | Claude recommended (+ reason) | Founder chose |
|---|---|---|---|---|
| 4.1 | Product name | Schoolbase · Rollcall · Classbook · Campusly | Schoolbase: plain and self-explanatory | **Campusly** |
| 4.2 | Brand direction (pick one, never blend) | Calm & trustworthy · Warm & friendly · Bold & modern | **Calm & trustworthy**: a record system parents and principals must trust | **Calm & trustworthy** |
| 4.3 | Sign-in and 2FA | Email+password (2FA later) · + optional 2FA · + Google | Email+password, 2FA later: no external accounts needed | **Email + password + Google** |
| 4.4 | Pricing unit (flip test) | Per student · Flat per school · No pricing | **Per student, prices later**: plans stored as data, so a flip is a data change | **Per student, prices later** |

**What Claude did with the answers:**
- **Campusly:** Claude did *not* check domain or trademark availability (that's a §8 task needing web
  checks). It's recorded as an open founder item, not a fact (§6 "don't record guesses as facts").
- **Google sign-in:** the playbook (§2.4) says the agent **never creates accounts or OAuth apps**. So Claude
  builds the Google wiring, keeps the button **hidden until the founder adds `GOOGLE_CLIENT_ID` /
  `GOOGLE_CLIENT_SECRET`** (§9.4 fallback "Social sign-in → button hidden"), and writes founder console
  steps in the §22.9 format.
- **Founder disagreed with Claude twice (4.1, 4.3) and that's fine.** §3.5: Claude states the risk once,
  then builds what the founder chose. Neither choice breaks a §2 rule, so no pushback was needed.

**Decisions Claude took alone (technical, §1.2), recorded so students can see the boundary:**
- Auth library: **Better Auth** (playbook §23 default; maintained, no hand-rolled crypto). Schools,
  memberships and invitations are our own tables, so tenancy stays explicit and teachable.
- Roles: `owner`, `admin`, `teacher`, `parent`, `student`, one `can()` function (§10).
- Email: dry-run fallback. Every mail is written to a `mail_log` table and printed to the console;
  nothing reaches a real inbox (§2.3).
- Timeline: one build session, slice by slice (§5).
- AI stance: no AI feature in Phase 1 (Stage 7 is below the cut line, per 3.2).

---
