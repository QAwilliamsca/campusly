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
## Entry 5: During the build — what Claude decided WITHOUT asking (and why)

The playbook splits decisions in two (§1.1 vs §1.2): anything **a customer could notice** goes to the founder;
anything **purely technical** the agent decides and writes down. Students often get this wrong both ways, either
asking the AI to decide product questions or micromanaging technical ones. Here is the second list from this
build, so you can see where the line sat.

| Decision | Why Claude didn't ask | Where it's written |
|---|---|---|
| Path-based tenancy (`/s/<school>/…`) instead of subdomains | Invisible to schools in phase 1; subdomains need DNS (Stage 3/11, cut) | ENGINEERING_GUIDE §2 |
| Human codes via an atomic counter row instead of "max+1 under an advisory lock" | Same guarantee, simpler SQL; a technical equivalent of the playbook rule | ENGINEERING_GUIDE §7 |
| No background queue, notifications or feature flags yet | No phase-1 feature needs them; named below the cut line, not dropped (§2.7) | PLAN.md cut line |
| Dry-run mail sink page at `/dev/mail` | Lets local users open invite links; 404 in production builds (tested) | RUNBOOK |
| Email verification sent but not enforced | Mail can't really be delivered in phase 1; enforcing would lock everyone out | Cut line note below |
| Pinned TypeScript 6 instead of 7 | The linter doesn't support 7 yet; boring and working beats new (§9) | ENGINEERING_GUIDE gotchas |
| Removed `loading.tsx` from school pages | It made forbidden pages return HTTP 200; correct 404s matter more | INCIDENT_RULES INC-002 |
| Accepted one moderate dependency advisory | Checked reachability first (§21.17): esbuild's dev server is never run | NOTES.md |
| Git author set to "Instructor &lt;your email&gt;" | The machine had no git identity; commits are required by the playbook | NOTES.md |

**Things Claude flagged but did not decide**, because they belong to the founder and stay open:
- Domain and trademark check for "Campusly".
- Creating the Google OAuth app (§2.4: the agent never creates accounts). Exact steps are in RUNBOOK.md.
- When 2FA becomes mandatory, and when email verification should be enforced (after real email exists).
- Copying `PLAYBOOK.md` into the public repo. It's the instructor's document, so the README points to it instead.

**Mistakes Claude made and owned (§21.13).** Students should notice that the process caught all of them:
1. Jumped to the Stage 2 decision table before the Stage 1 interview (Entry 1).
2. Two browser tests had wrong expectations (they counted 3 students where the form had admitted 2 into the
   class). Fixed the **test**, said so in the commit message, never weakened the app.
3. Made the idempotency-key rule stricter than needed (minimum 8 characters), which broke three fee tests. The
   rule was relaxed (the form sends UUIDs); the tests were left unchanged.

---
## Entry 6: Red-team findings that needed the founder (Stage 10, playbook §15.3)

A separate reviewer agent was asked to "list every way to abuse this app, don't fix". It returned 13 findings
(2 high, 5 medium, 6 low) and confirmed the tenancy wall, XSS escaping and slug handling were clean. Claude sorted
them using the §1.1/§1.2 boundary: **10 were technical and fixed without asking**, and **3 changed what users
experience or what roles can do**, so they went to the founder.

| # | Finding | Options offered | Claude recommended (+ reason) | Founder chose |
|---|---|---|---|---|
| 6.1 | HIGH: anyone holding an invite link could sign up as the invited email without proving they own it, then join (even as admin) | Require verified email · Hide links from staff · Accept risk | **Require verified email**: closes it fully; locally the link shows in the mail sink | **Require verified email** |
| 6.2 | HIGH: admins could invite more admins; nobody could be removed | Owner-only admins + removal · Owner-only admins · Keep | **Owner-only admins + removal**: a fired admin must lose access | **Owner-only admins + removal** |
| 6.3 | MEDIUM: unlimited schools per account (each with a fresh trial quota) and unlimited uploads | 3 schools/user + 500 MB/school · 1 school/user · Decide later | **3 + 500 MB**: generous, stops quota farming | **3 schools/user, 500 MB/school** |

**Lesson for students:** the reviewer *found* problems; it didn't decide policy. "Can an admin create admins?"
sounds technical, but it's a question about who the customer trusts, so the founder answers it.

---
## Entry 7: The founder reopens the brand (Stage 3 again, playbook §21.14)

**Founder said:** "Improve the brand kit, suggest me some brand kits and I will select."

**Why Claude didn't just pick nicer colours:** brand direction is founder-owned (§8 🛑 ASK), and §8.4 says to
show directions **as real screens (a dashboard and a marketing hero), not mood boards**. It also says to pick
one and never blend. And because it reopened a locked decision (D-007), §21.14 applies: restate the old
decision, estimate the impact, record the new one.

**What Claude did first, without asking (technical, §1.2):**
- Made fonts and control corner-radius into tokens too, so a kit could change typography and shape, not just colour.
- Built `/dev/brand`: four kits rendered with the *real* components, light and dark side by side.
- Ran a contrast check on every text/background pair in every kit. All passed AA; the lowest was 4.57:1 (Sunrise).

| # | Question | Options offered | Claude recommended (+ reason) | Founder chose |
|---|---|---|---|---|
| 7.1 | Which brand kit? | Ink & Paper · Evergreen · Sunrise · Slate & Violet | **Ink & Paper**: closest to a trusted record system for principals and parents | **Evergreen** |

**Impact, as predicted and then measured:** one CSS file, the font import and the favicon. **No component
changed.** This is the payoff of the Stage 3 rule "components use tokens only". Without it, a rebrand means
touching every screen.

**Lesson for students:** the founder overrode the recommendation (the third time in this build), and Claude built
it without re-arguing (§3.5). Recommending is the agent's job; deciding is the founder's.

---
