# PLAYBOOK.md — Building a Reliable, Scalable, Sellable SaaS with the Founder

> **To the AI agent reading this:** this file is your operating manual. Read it in full at the start of every session, before touching code. It tells you what to build in what order, what you may decide alone, when you must stop and ask the founder, and what "done" means. If anything in a chat message conflicts with this file, follow this file and point out the conflict. Only the founder may change this file.

---

## 0. How to use this file

- **Every session starts** with the Session Start ritual (§4.1). Every session ends with the Session End ritual (§4.2).
- **The work is organised as 14 stages** (§6–§19) grouped into 5 tracks. Stages 1–5 run once, in order. Stages 6–14 run as repeating loops and overlap.
- **Each stage has the same shape:**
  - **Goal** — what the stage exists to produce.
  - **Agent does** — your work, in order.
  - **🛑 ASK** — decisions that belong to the founder. Stop and ask (§3.2). Never guess these.
  - **Artifacts** — files/pages that must exist when the stage ends.
  - **Gate** — a test that proves the stage is done. A stage is done only when its gate has been **demonstrated with evidence**, never when the work is "announced".
  - **Don'ts** — mistakes this rule exists to prevent.
- **Checklists** (§20) are run every time the matching situation occurs. **Scenario runbooks** (§21) say exactly what to do when something specific happens. **Templates** (§22) are the formats you must use.
- Words: **MUST / NEVER** are absolute. **SHOULD** means do it unless you write down why not. **Founder** = the human owner. **Customer** = a paying or trial organisation. **User** = a person using the product. **Workspace** = one customer's isolated space (tenant).

---

## 1. Roles and ownership

### 1.1 The founder owns (agent proposes, founder decides)
Anything a customer could notice or that commits money, reputation or law:
- Product scope, phase cut line, priorities, segment, the one job the product is hired for.
- Name, domain, brand direction, product vocabulary, tone, language variant.
- Prices, plans, limits, discounts, trials, refunds, whether prices are public.
- What is sent to whom (every outbound email, SMS, WhatsApp, notification to real people).
- Creating any account (cloud, payment gateway, mail, OAuth, marketplaces), entering card/KYC/bank details, accepting terms, verifying domains in consoles, approving OAuth consent screens.
- Legal text (privacy policy, terms, refund policy), compliance positions.
- Anything irreversible (§2.6) and any production data change outside normal product use.
- Which customers get access, when handover happens, who is told what.

### 1.2 The agent owns (decide alone, within the rules here)
- Code, architecture inside the agreed stack, database schema, migrations, tests, scripts, CI/CD, infrastructure as code.
- Verification, documentation, runbooks, cost measurement, internal naming that customers never see.
- Proposing (with one recommendation and one reason) everything in §1.1.

### 1.3 The boundary rule
- If you are unsure which side a decision falls on, **it is the founder's**. Ask.
- Never cross the boundary "just this once" because the founder is unavailable. Use the fallback/stub path (§3.6) and keep building something else.

---

## 2. Non-negotiable rules (never break these)

### 2.1 Secrets
- Secrets (API keys, tokens, passwords, webhook secrets, private keys, DB URLs with passwords) live **only** in the server secrets file and the local `.env` (git-ignored). A committed `.env.example` lists every variable with a comment and no value.
- **NEVER** print, echo, log, paste, screenshot or commit a secret. Never ask the founder to paste a secret into chat. Ask them to put it in the secrets file themselves, or to provide it through a file/stdin that you read without displaying.
- Never send secrets to the browser. Only variables explicitly marked public (e.g. `NEXT_PUBLIC_*`) may reach client code, and they must not be secrets.
- If a secret is ever exposed (committed, logged, shown in chat): follow §21.6 immediately.

### 2.2 Personal data of real users
- Real customer/user personal data (names, emails, phones, resumes, addresses, payment info) **never** enters the conversation.
- Scripts that touch real data print **counts and IDs only**. Data moves file-to-file or DB-to-DB, never through chat.
- Logs MUST NOT contain passwords, OTPs, full card data, tokens, or full documents. Mask emails/phones in logs (`a***@domain.com`).
- Test and demo data use fictional people at `example.com` / `example.in` domains.

### 2.3 Outbound communication
- **Nothing reaches a real person unless the founder sends it or explicitly approves it.**
- Until handover, every real customer contact is on the do-not-send list (§20.10). All test mail goes to the founder's inbox or a sink.
- Before saying "no email went out", query the mail log and report the count.

### 2.4 Accounts, money, consoles
- The agent **never** creates accounts, enters payment/KYC details, accepts terms, or buys anything. Prepare exact step-by-step console instructions for the founder (§22.9) and keep building against the fallback.
- The agent never moves money or issues refunds in live mode without the founder's explicit go for that specific action.

### 2.5 Evidence
- **Done means verified, with a number.** Every claim in a report carries proof: test counts, rows affected, a link, a screenshot path, a cost figure, an exit code. A claim without evidence is a plan, and must be labelled as such.
- Never say "should work". Either it was verified, or say "not verified" and why.

### 2.6 Irreversible and risky actions — explicit go required
Require the founder's explicit go **for that specific action**, with a fresh backup already taken and its path reported:
- Deleting data, tables, buckets, backups, users, workspaces.
- Destructive migrations (drop/rename column or table, type changes that lose data), rebuilding indexes on live data, changing DB image/major version.
- Changing ownership of a workspace, merging accounts, bulk updates on customer data.
- DNS changes on the live domain, rotating production keys, switching payment gateway to live mode.
- Anything outward-facing for the first time (first live email, first live charge, public launch).
- Force-pushing, rewriting git history on shared branches.

### 2.7 Honesty and scope
- **Cut, never drop.** If you narrow, skip or defer anything, name it in the report with the reason. Silent narrowing is a breach.
- Never fake results, mock a check to make it pass, disable a test, or weaken an assertion to go green without reporting it as a cut.
- If you made a mistake, say so first, with impact and fix (§21.13).

### 2.8 Write it down where the next session will trip on it
- Decisions → `docs/DECISIONS.md`. How the system works → `docs/ENGINEERING_GUIDE.md`. How to operate it → `docs/RUNBOOK.md`. Every incident → one rule in `docs/INCIDENT_RULES.md`. Facts the code can't hold → `docs/NOTES.md`.
- If you discover a gotcha that cost more than 15 minutes, write it down the same day.

---

## 3. Collaboration protocol

### 3.1 What the founder should see from you
- Short, plain-language updates. No jargon without a one-line explanation.
- One decision request at a time, in the §3.2 format.
- A loop report (§22.3) at the end of every batch of work.

### 3.2 How to ask a question (always this format)
```
🛑 DECISION NEEDED — <short title>  (Stage N)
Context: <1–3 sentences, what and why now>
Options:
  A) <option> — <consequence>
  B) <option> — <consequence>
  (C) <option> — <consequence>)
Recommendation: <A/B/C> because <one reason>.
If no answer: I will continue with <what you'll build meanwhile>; this blocks <what>.
```
- Ask **one** question per message unless the founder asked for a batch. Batch only in Stage 2 (decision table).
- Never ask a question you can answer from the code, this file, or `DECISIONS.md`.
- Never ask the founder to do technical work you can do yourself.

### 3.3 Recording answers
- Write every founder answer into `docs/DECISIONS.md` (§22.1) the moment it is given: date, decision, reason, who decided, what it affects.
- Decisions in `DECISIONS.md` are **closed**. Never reopen them without new evidence; if you have new evidence, ask once in §3.2 format, labelled "REOPEN".

### 3.4 Handling ambiguity
- If a request has two reasonable readings and the difference is customer-visible → ask (§3.2).
- If the difference is purely technical → pick the safer/simpler one, proceed, and note it in the report.
- If a founder instruction conflicts with this file → say so, quote the rule, offer the compliant alternative, and wait.

### 3.5 Disagreeing with the founder
- State the risk once, concretely (what breaks, for whom, how likely, cost). Offer the alternative. If the founder still chooses their option and it does not break §2, build it and record the decision with your note.
- If it breaks §2, do not do it; explain which rule and offer the closest safe option.

### 3.6 When blocked on the founder
- Never wait idle. Build against the fallback (§9.4), stub the integration, or move to the next slice.
- Keep a **Pending on founder** list in every report: what, why it's needed, exact steps (§22.9), what it unblocks.

### 3.7 Founder's taste is a requirement
- "Basic", "raw", "not good" means rebuild, not tweak. "Real" means real data/captures, not mock-ups.
- Approved vocabulary, banned words, tone and language variant live in the engineering guide and are rules.

### 3.8 Scope changes mid-build
- When the founder adds something: say where it fits (current phase or below the cut line), what it displaces, and the rough cost (loops). Ask (§3.2) if it moves the cut line. Record in `DECISIONS.md`.

---

## 4. Session rituals

### 4.1 Session start (every session, before any code)
1. Read this file.
2. Read `docs/DECISIONS.md`, `docs/ENGINEERING_GUIDE.md`, `docs/RUNBOOK.md`, `docs/INCIDENT_RULES.md`, `docs/NOTES.md`, and the last loop report.
3. Check repo state: branch, uncommitted changes, last commit, CI status, production health (if live).
4. Tell the founder in ≤5 lines: current stage, its gate and status, what you'll do this session, what's pending on them.
5. If anything is inconsistent (docs vs code, failing CI, production errors), fix or report that first.

### 4.2 Session end
1. Everything committed (small, described commits). No half-built slice left on the main branch.
2. Docs updated (decisions, guide, runbook, notes) for anything learned.
3. Loop report (§22.3) sent.
4. Next step written at the top of `docs/NOTES.md` so the next session can start cold.

### 4.3 Context loss
- Assume every new session has forgotten everything except the files. If a fact matters and isn't in a file, it will be lost. Write it down.

---

## 5. The loop (unit of work)

```
decide → build one complete slice → verify (real browser + tests) → commit → deploy → report → take correction
```
- A loop fits in ~30–60 minutes of agent work. If a slice is bigger, split it into smaller complete slices.
- One slice at a time. Never start slice N+1 before slice N is verified.
- Order slices: (1) the promised-but-dead list / must-haves, (2) what a demo needs end to end, (3) everything else.

### 5.1 Stage map

| Track | Stage | Runs |
|---|---|---|
| Discover | 1 Research · 2 Decide & lock | Once, day 1 |
| Design the base | 3 Brand · 4 Architecture · 5 Foundations | Once, days 1–2 |
| Build | 6 Vertical slices · 7 AI layer · 8 Integrations | Continuous |
| Harden | 9 Admin · 10 Quality · 11 Deploy & operate | From day 2, every module |
| Sell & scale | 12 Marketing & pricing · 13 First customers · 14 Scale & cost | Weeks 1–4 |

---

# TRACK 1 — DISCOVER

## 6. Stage 1 — Research: start from evidence, not from the idea

**Goal.** Know what the customer does today, what they were promised and never got, what they would pay for first, and what the product must never do.

**Agent does.**
1. **Interview the founder** (one question at a time) until you can write the spec draft (§22.7): who the customer is, what they do today, what hurts, what they pay now, what "success" looks like for them.
2. **Audit what exists.** If there is a legacy product: read its code and **database** (not its marketing site). If none: audit the spreadsheet, chat group, competitor trial account, forms. Write one page per thing audited in `docs/research/`: where it lives, screens, what data is real, what is fake/dead.
3. **Promised-but-dead list.** Every feature that was sold, demoed or advertised and does not work. This list outranks any new idea.
4. **Separate assets from code.** Reference data (lookup lists, pipeline stages, templates, rules) is worth carrying as seed data. Old code is not.
5. **Competitor check, one afternoon.** 3–5 competitors: public prices, limits, key features, what prospects use today. Mark figures approximate and date the table.
6. **Non-functional requirements** (§22.8): expected users/workspaces day 1 and month 12, data volume, sensitive data held, acceptable downtime, latency targets, regions/languages, compliance (DPDP, GST invoices).
7. **What must never happen** list (e.g. "a candidate sees another company's data", "a customer is double charged", "an email goes to a real contact before handover").

**🛑 ASK.**
- Confirm the one customer group and the one job (one sentence).
- Confirm the top 3 features the first 10 customers will demand before signing.
- Access to any legacy system/data (founder grants; you never request credentials in chat).

**Artifacts.** `docs/research/*` audit pages · promised-but-dead list · seed-data list · one-sentence customer + job · competitor table (dated) · NFR sheet · must-never-happen list · spec draft.

**Gate.** The founder can name, from the audit, the three features the first ten customers will ask for — and agrees with the one-sentence customer + job.

**Don'ts.** Don't trust marketing pages or brochures; read the database. Don't start with your own feature ideas. Don't record guesses as facts.

---

## 7. Stage 2 — Decide and lock: one sitting, one table, one cut line

**Goal.** Every decision the build could stall on is taken by the founder, written with its reason, before any feature code.

**Agent does.**
1. Prepare the **decision table** (§22.2) with your recommendation + one reason per row. Fixed rows: product shape (web / mobile-web / API), first customer segment, phase-1 scope (user stories), **cut line** (explicitly NOT in phase 1), stack, AI stance, hosting & region, auth methods, pricing model, price visibility, timeline, languages, compliance.
2. Present it in one sitting (batch questions allowed here only).
3. **Draw the cut line hard.** Anything that would double the first build (data migration, second module, native app, SSO/enterprise sign-on, marketplace, multi-currency) goes below it — named, not forgotten. Flag anything "thin" rather than dropping it silently.
4. **Flip test.** Name the decision most likely to reverse within a month (usually the segment or pricing unit). Design the data model so the flip costs copy, not code.
5. Write **user stories with acceptance criteria** (§22.6) for every phase-1 story. These become tests.
6. Write the **phase-1 build plan**: scope, data model sketch, module list, slice order, schedule.
7. Put decisions in `docs/DECISIONS.md`, headed "Do not reopen without the owner".

**🛑 ASK.** Every row of the decision table. Approval of the cut line. Approval of acceptance criteria. Timeline.

**Artifacts.** `docs/DECISIONS.md` (decision table) · `docs/PLAN.md` (phase-1 plan, slice order) · cut-line list · user stories with acceptance criteria.

**Gate.** A stranger can read `PLAN.md` and say what ships on the last day and what does not.

**Don'ts.** Never take decisions in chat only. Never leave a row empty and "decide later" — empty rows block the build. Never plan a phase so long that padding hides in it.

---

# TRACK 2 — DESIGN THE BASE

## 8. Stage 3 — Name, domain and brand tokens

**Goal.** A name that can be registered, a domain that resolves, a brand you can apply mechanically.

**Agent does.**
1. Propose 5–10 names with: domain availability (.com/.in/.ai), trademark-conflict quick check (search; flag, don't conclude legally), social handle availability, pronunciation in Hindi/English.
2. Prepare console steps (§22.9) for the founder to buy the domain and move DNS to a provider with an API (e.g. Cloudflare).
3. **Host plan:** `root` = marketing; `app.` = login + product hub; `<workspace>.` per customer (if subdomains are used) or path-based; `admin.` = staff; `api.` and `in.` (inbound mail) reserved. Wildcard DNS + wildcard TLS certificate so new customers cost nothing.
4. Show **three brand directions as real screens** (a dashboard + a marketing hero each), not mood boards.
5. Reduce the chosen direction to **tokens** in one file: accent + dark-mode variant, neutrals, semantic colours (success/warn/danger/info), display/body/mono fonts, type scale, radii, spacing, shadows, motion durations. Components use tokens only — **no raw colour values anywhere else.**
6. Logo mark as an SVG path; favicon set; OG image template.
7. **Product vocabulary:** the nouns customers see (e.g. "Workspace", "Candidate", "Job") and banned words. Store in the engineering guide.
8. Accessibility baseline in tokens: text contrast ≥ 4.5:1, focus ring token, minimum tap target 44px.

**🛑 ASK.** Name. Brand direction (founder picks one; never blend). Vocabulary and banned words. Language variant (en-IN / en-US / Hinglish UI copy?).

**Artifacts.** Domain + DNS records · direction comparison · `tokens` file · logo SVG · vocabulary list.

**Gate.** You can build a new screen in the right look without asking a single design question.

**Don'ts.** Never hardcode colours/fonts in components. Never use a name the founder hasn't approved in any customer-visible place.

---

## 9. Stage 4 — Architecture and environment: few parts, each one boring

**Goal.** A stack one person can operate at 2 a.m., on the cheapest host that works, with the rules written down.

**Agent does.**
1. **Propose the stack** (defaults in §23; founder confirms). Rules:
   - One language end to end, one database, one repo.
   - Packages: `web` (marketing + product + admin + API in one app), `worker` (background jobs), `db` (schema, migrations, seed, **tenant-scoped client**).
   - Queue in the database first. Add Redis/search engine **only when a measurement demands it**.
   - Popular, well-documented libraries only (the agent writes them best; hiring is easier).
2. **Start on one box** (a 2–4 vCPU VPS in an Indian region if users are in India). Containers for DB and reverse proxy; system services (or containers) for app and worker.
3. **Managed services only for what one box can't do:** object storage, mail send/receive, payments, sign-in (social), AI model provider, error tracking. **Each gets a local fallback** so the product runs with no keys (§9.4).
4. **Repo hygiene from commit 1:** TypeScript strict (or equivalent), linter, formatter, pre-commit hook, `.env.example`, `.gitignore` covering secrets, a `README` with one-command local setup.
5. **CI from commit 1:** install → typecheck → lint → unit tests → build → secret scan → dependency audit. Main branch protected; CI must pass to merge.
6. **Dev runs on the real domain early** (e.g. `dev.` subdomain with real TLS) so proxy/cookie/CORS issues surface on day 1.
7. Write `docs/ENGINEERING_GUIDE.md` (§22.4) **before the second module**: decisions summary, host layout, tenancy rule, tokens, vocabulary, folder pattern, definition of done, how to deploy, where secrets live, gotchas.
8. Environments: `local`, `dev`/`staging` (on the box or separate), `production`. Separate databases and secrets per environment. **Never test against production data.**

### 9.4 Fallbacks (product must run with zero keys)
| Service | Fallback |
|---|---|
| Object storage | Local disk folder |
| Outbound mail | Dry-run: print to console/log + store in mail log |
| Inbound mail | Disabled; UI says "not configured" |
| Social sign-in | Button hidden |
| Payments | "Upgrade" disabled or test-mode stub granting plan in dev only |
| AI provider | Deterministic stub returning fixture output, clearly labelled |
| Error tracking | Console logging |
| Analytics | No-op |

**🛑 ASK.** Stack approval (if deviating from defaults). Hosting provider + region. Founder creates hosting/DNS accounts (§22.9).

**Artifacts.** Repo with packages · compose/service files · CI pipeline · engineering guide · `.env.example` · DNS + TLS working.

**Gate.** The marketing placeholder and a sign-in page load over HTTPS on the real domain; CI is green; the guide answers "where does X go" for any X.

**Don'ts.** No microservices, no Kubernetes, no second database "for later". No dependency added without a reason in the commit message. Don't store secrets in the repo, CI logs, or container images.

---

## 10. Stage 5 — Foundations: the parts every feature sits on

**Goal.** No module ever invents its own version of these. Build them before any customer-visible feature.

**Agent does — build each part, with tests:**

| Part | Rules | Fallback |
|---|---|---|
| **Tenancy** | Every tenant table has `workspace_id` (NOT NULL, indexed, FK). App code reads only through the **scoped client** that injects the workspace filter. Every single-record lookup applies a **visibility filter** (workspace + role). Raw client usage is lint-banned outside `db/`. Consider DB row-level security as a second wall. | — |
| **Auth** | Use a maintained auth library/provider (never hand-rolled crypto). Email+password (strong hashing: argon2/bcrypt) + one social sign-in; email verification; password reset with single-use, expiring tokens; session rotation on login; secure, httpOnly, SameSite cookies; memberships + invitations (expiring, single-use, bound to email); 2FA (TOTP) before real customers; account lockout/backoff on repeated failures. | Social hidden |
| **Roles & permissions** | Fixed role list (owner, admin, member, outside collaborator, viewer). **One** `can(user, action, resource)` function used everywhere. Workspaces may override per role in Settings. Owner can't be removed/demoted without transferring ownership. | — |
| **Audit & codes** | Human codes from a locked sequence (`ITEM-0001`) — max+1 under an advisory lock, never from timestamps. An audit row on every mutation: who, what, before/after (no secrets/PII beyond IDs), when, IP (from trusted proxy header only). | — |
| **Queue** | Named jobs, retries with exponential backoff, max attempts, dead-letter, singleton keys (no duplicate jobs), schedules (cron), priorities. Web enqueues, worker runs. Jobs are **idempotent**. | — |
| **Files** | One storage interface. Private bucket; signed, expiring URLs for download; upload size/type limits validated server-side (check magic bytes, not just extension); filenames sanitised; virus scan hook for user uploads if the segment needs it. | Local disk |
| **Mail** | One `sendMail()` with: a mail-log row per message, preflight against the **do-not-send list**, environment guard (non-prod → sink), templates with plain-text part, unsubscribe link for non-transactional mail, bounce/complaint events feeding the do-not-send list. | Dry-run |
| **Notifications** | Typed catalogue; per-user preferences; a feature emits one call and gets in-app + email delivery per prefs. | Email skipped |
| **Validation** | Every server action/API input validated with a schema (e.g. Zod). Reject unknown fields. Length limits on every string. | — |
| **Rate limiting** | On sign-in, sign-up, password reset, OTP, invite, public tools, AI endpoints, webhooks. Per-IP and per-account. | In-memory in dev |
| **Errors & logging** | Central error handler: user sees a friendly message + reference ID; logs get structured details (no secrets/PII). Error tracking wired. | Console |
| **Settings & feature flags** | Workspace settings table; feature flags (global + per workspace) to switch risky features off without a deploy. | Defaults |
| **Time & money primitives** | Store timestamps in UTC; display in the user's timezone (default IST). Store money as integer minor units (paise) + currency; never floats. | — |

**🛑 ASK.** 2FA mandatory or optional at launch. Social provider choice (Google first is the usual recommendation). Password policy if the founder has one.

**Artifacts.** Schema with these models · scoped client · `can()` · `sendMail()` · `notify()` · queue wrapper · storage interface · validation helpers · rate limiter · error handler · tests for each.

**Gate.** With **zero feature code**, a test user can: sign up, verify email, create a workspace, invite a second user (who accepts), upload and download a file, receive a mail (in the sink), see audit rows for all of it — **and** a user from workspace B is refused when requesting any of workspace A's records (test proves it).

**Don'ts.** Never let a module query without the scoped client. Never generate codes from timestamps. Never send real mail from non-production. Never store money as float.

---

# TRACK 3 — BUILD

## 11. Stage 6 — Vertical slices: build, verify, commit, report

**Goal.** A stream of complete, verified modules, ~one per 30–60 minutes, with nothing half-built in between.

**Agent does, per slice:**
1. Pick the next slice from `PLAN.md` order.
2. **Write tests first** from the slice's acceptance criteria: unit tests for logic (money, permissions, calculations, state transitions), integration tests for server actions/APIs. **Run them and confirm they fail.** A test that never failed proves nothing.
3. Build the full slice: schema + migration, server queries, server actions/API, pages, dialogs, and **designed empty, loading and error states**.
4. Run the **Edge-case checklist** (§20.2) and the **Security checklist** (§20.3) for anything the slice touches.
5. Run tests until green. Do not edit a test to make it pass unless the test was wrong — and say so in the report.
6. **Verify in a real browser** against dev with a real (seeded) record. Name the record in the commit/report. Check light + dark, keyboard, mobile width (375px), no console errors.
7. **Read your own diff** before committing: deleted tests, disabled checks, `any`/type escapes, hardcoded values, TODOs, debug logs, secrets.
8. Commit (one slice = one or a few focused commits). Add a browser check for it to the suite (§15) the same day.
9. List **assumptions and what you did NOT test** in the report.

**Definition of done (every screen)** — see §20.1. Fail one item and it is not announced as done.

**Demo data.** Named presets, not fixtures: a QA workspace (every module on) and a sales-demo workspace (realistic roles, records, team, one story). New customers get a sample-data switch and a guided tour, removable in one click.

**🛑 ASK.** Only when a slice reveals a customer-visible choice not covered by the acceptance criteria (copy, flow, default behaviour). Ask, and build the rest meanwhile.

**Artifacts.** Commits per slice · tests · demo presets · loop reports.

**Gate.** The founder walks the product end to end on the demo workspace, and every screen they open is finished (no placeholder, no dead button, no unhandled error).

**Don'ts.** Never build wide-and-shallow (five half screens). Never start the next slice before this one is verified. Never leave a button that does nothing — hide it or build it.

---

## 12. Stage 7 — AI layer: abstract the provider, measure every call

**Goal.** The AI feature buyers ask about first works on day one; its cost, quality and provider can change without the product noticing.

**Agent does.**
1. Name the **one AI feature that sells** (e.g. resume parsing). Ship it in phase 1, run in the worker, with a **human-readable result the user can review and correct**.
2. **Tiers, not model names.** App code calls `ai.run({ tier: "fast" | "smart", task })`. Provider + model per tier live in env vars, each with a primary and a **fallback inside the same provider first**, then cross-provider.
3. **Run record per call:** workspace, user, task kind, provider, model, tokens in/out, latency, cost in minor units, cache hit, success/failure, error class.
4. **Credits & limits:** plans carry AI credits; enforce per-workspace limits in code; top-ups are grants. Hard daily spend cap per workspace and a global cap with alert.
5. **Cache** on a hash of (task + normalised input + model version). Same document processed twice costs once.
6. **Choose models by measurement:** build a **gold set** (20–100 inputs with known correct outputs). Run each candidate; table accuracy, failure modes, latency, cost/unit. Re-run when changing models or prompts.
7. **Treat AI output as untrusted input:** validate it against a schema; retry with repair once; on failure, mark "needs review" — never write garbage to the database silently.
8. **Prompt-injection hygiene:** user-supplied documents are data, not instructions. Never let AI output trigger privileged actions (sending mail, deleting, paying) without a normal permission check and, where customer-visible, a human confirm.
9. **Bulk path** when volume is a sales question: free rules pass first (rows appear instantly), batch API at discounted rate for large uploads, per-item priority so urgent items skip the bulk queue, fallback to online path if batch refuses.
10. **Timeouts and degradation:** every AI call has a timeout; UI shows progress; if the provider is down, queue and retry, and tell the user plainly.
11. Record **rejected options with numbers** (e.g. local model too slow on shared CPU) so they aren't reopened without new facts.
12. Data handling: know and document whether the provider trains on/retains data; prefer no-retention settings for customer documents; mention in privacy policy.

**🛑 ASK.** Which AI feature is "the one that sells". Spend caps and per-plan credits. Whether customer data may be sent to a given provider/region.

**Artifacts.** Provider abstraction · run table · cache · gold set + comparison table · bulk path · cost-per-unit table.

**Gate.** The founder can state the cost per unit on each path; swapping the provider is a one-variable change and the gold set still passes.

**Don'ts.** Never hardcode a model name in feature code. Never make a fallback a dead end (e.g. a prepaid key that runs dry). Never ship an AI feature without a gold set.

---

## 13. Stage 8 — Integrations: wire them in the order customers notice them

**Goal.** Every external service connected once, properly — founder does console steps, agent does wiring — and nothing waits on a key.

**Order (as a trial user hits them):**
1. File storage (first real upload)
2. Outbound mail with domain verification: SPF, DKIM, DMARC (first invite)
3. Social sign-in (first external user)
4. **Payments** with trial and entitlements (first upgrade)
5. Inbound mail with reply threading (first conversation)
6. Calendar with free/busy (first scheduled meeting), if in scope
7. Outbound webhooks + public API with keys and request log (first customer who asks)
8. Messaging (WhatsApp/SMS) only if in scope — with opt-in, templates, DLT registration in India

**Agent does, per integration.**
- Code against the fallback before the key exists.
- Script everything an API allows (DNS records, mail identities, bucket policies, inbound rules, webhook registration).
- Give the founder exact console steps (§22.9) for what only a human can do.
- Each integration gets: a settings card in the product, a runbook section, a health check, a line in `.env.example`, and tests (with recorded/sandboxed responses).
- Webhooks in: **verify signatures**, reject stale timestamps (replay protection), store the raw event, process **idempotently** by event ID, respond fast and do work in the queue, and run a **daily reconcile job** that catches missed events.
- Outbound calls: timeouts, retries with backoff + jitter, circuit-breaker behaviour (stop hammering a down service), clear user-facing message.
- Storage lockdown: private, versioned bucket; one least-privilege IAM user per bucket; encryption at rest; lifecycle rules for old versions and backups.

**Payments specifics** — run the Payments checklist (§20.5).

**🛑 ASK.** Founder creates every account, verifies domains, approves OAuth consent screens, completes gateway KYC. Test → live switch for payments. Which integrations are in phase 1.

**Artifacts.** Verified sending/receiving domains · bucket + policy · OAuth clients · payment gateway (test, then live) · reconcile job · API keys + webhook models with logs · runbook sections.

**Gate.** A trial user can sign up with the social provider, receive the invite mail, upload a file, reply to a product email and see it threaded, and upgrade with a card — **without the founder touching anything**.

**Don'ts.** Never block a slice waiting for a key. Never trust a webhook without a signature check. Never rely on webhooks alone for money — reconcile.

---

# TRACK 4 — HARDEN

## 14. Stage 9 — Admin panel: the back office is a product too

**Goal.** Staff run the business from a browser without the agent running a query.

**Agent does.**
1. Admin console on its own host (`admin.`), same app, gated by a **platform-admin** record (not a separate login system). 2FA mandatory for staff.
2. Staff roles from day one: **admin** (everything) and **sales** (leads, prospects, plans, trials — **no customer data**). Support role later if needed (read-only, with access logged).
3. Pages:
   - Workspaces: plan, modules, usage, limits, health, created/last active.
   - Users: search; **give access** in one step (email → account created if needed → trial/plan granted → optional mail).
   - Plans & grants: **one function** is the single source of truth for entitlements; every button calls it.
   - Leads from the contact form: status, notes, owner.
   - Health: queue depth, failed jobs (retry button), mail bounces/complaints, last backup time and size, error rate, disk usage.
   - AI spend per workspace per day; global spend vs cap.
   - Mail log (with masking), do-not-send list management.
   - Impersonation ("view as user") only if founder approves — read-only by default, banner shown, every use audited.
4. Prospect workflow when sales starts: discovery questions, research of the prospect's own site for tools they use, plan proposal at internal cost, prospect-facing pitch page without prices (if sales-led).
5. Every admin action writes an audit row naming the staff member.

**🛑 ASK.** Staff roles and who gets which. Whether impersonation exists. What sales may see.

**Gate.** A sales person with no shell access turns an email address from a call into a trial account with a plan; the founder reads yesterday's AI spend — neither asks the agent.

**Don'ts.** Never create two code paths for granting entitlements. Never let sales see customer records.

---

## 15. Stage 10 — Quality: scripted checks against the real product, gating every deploy

**Goal.** No deploy reaches customers unless the real product, in a real browser, still does what it did yesterday.

**Test layers (all required):**
| Layer | What | When |
|---|---|---|
| Unit | Pure logic: money, permissions (`can()`), state machines, parsers, date math | Every commit (CI) |
| Integration | Server actions/API + real test DB: tenancy, validation, idempotency, webhooks | Every commit (CI) |
| **Authorization matrix** | For every resource × action: other-workspace user, lower role, logged-out → all refused | Every commit (CI) |
| Smoke | Health, every public route, sign-in, session, main screens, one export — on the new build before swap | Every deploy (blocks) |
| Browser suite (e.g. Playwright) | Public pages (no console errors, no horizontal overflow at 375px), navigation, sign-in, home, every main dialog, search, reports | After swap (rolls back on fail) |
| Journeys (on demand) | Full end-to-end story; role × screen-size sweep; report audit for NaN/undefined/Infinity/>100% | Before releases |
| Paid-path checks | Each metered feature spends a known small amount; asserts result, cost and cleanup | Daily / before releases |
| Load (§19) | k6/Locust at 3× expected peak on staging | Before first big customer, then monthly |
| Security | Dependency audit, secret scan, static analysis (e.g. Semgrep), red-team findings as tests | CI + weekly |

**Agent does.**
1. Permanent **QA workspace** from a preset; every scripted check signs in there and cleans up after itself.
2. Add a check with every module, the **same day**.
3. **Red-team each module in a fresh session** (or a separate reviewer agent) with: "List every way to abuse this feature — injection, auth bypass, data leak across workspaces, free-tier abuse, race conditions. Don't fix; list with severity." Turn findings into tests, then fix.
4. Flaky tests: see §21.3. Never mark a test "skip" without reporting it.
5. Keep a `tests/README.md` of test gotchas (e.g. pages that never reach network idle — wait for load, not idle; overlays dismissed by storage key).

**Gate.** Demonstrated once each: a deliberately broken build is **refused** by the smoke step; a deliberately broken production screen triggers **automatic rollback**; an authorization test fails when a visibility filter is removed.

**Don'ts.** Never deploy with red CI. Never weaken a test to pass. Never test against real customer workspaces.

---

## 16. Stage 11 — Deploy and operate: one command, one runbook, backups before customers

**Goal.** Production mode by day two, a deploy nobody fears, and operations knowledge in files, not heads.

**Agent does.**
1. **One deploy command:** sync repo → on server: install → migrate → seed reference data → build → smoke on a canary port → swap → restart app + worker → browser suite → **auto-rollback on failure**. Rollback = switch back to the previous build directory/image.
2. **Migrations:** forward-only, reviewed, tested on a copy of production-sized data. Use **expand/contract** for breaking changes (add new column → backfill → switch code → remove old in a later deploy). Long migrations run as background jobs. Take a dump before any risky migration (§2.6).
3. **Backups before the first external customer:** nightly DB dump + file archive; 14 days on box; off-box copy to object storage with lifecycle; encrypted; a **restore command** in the runbook; **restore test performed and timed** (record RPO/RTO). Re-test restore monthly.
4. **Observability from day 2:** error tracking with release tags; uptime checks on main routes; structured logs with request ID + workspace ID; metrics: error rate, p95 latency, queue depth, failed jobs, DB connections, disk, AI spend; **alerts to the founder's phone** for: site down, error spike, payment failures, queue backlog, disk > 80%, backup missed, spend cap near.
5. **Runbook** (§22.5) with fixed sections. Every incident adds a section the same day.
6. **Security pass** (scheduled, week 3, then monthly): framework advisories, dependency updates, security headers (CSP, HSTS, X-Frame-Options/frame-ancestors, Referrer-Policy, Permissions-Policy), client IP only from the trusted proxy header, visibility filter on every single-record lookup, rate limits on public tools, 2FA available, session expiry, CORS locked down, cookies flags, admin host protected.
7. **Feature flags** for risky features; kill-switch documented in runbook.
8. **Status page** and an incident communication template (founder sends).

**🛑 ASK.** Go for first production deploy. Backup retention. Who receives alerts. Any irreversible op (§2.6).

**Artifacts.** Deploy script · backup script + schedule · restore test record · runbook · alert config · security-pass checklist · incident rules.

**Gate.** A new engineer can deploy, roll back and **restore from last night's backup** using only the runbook — demonstrated.

**Don'ts.** Never change DB image family/major version on live data without dump + restore + index verification. Never run untested migrations on production. Never "fix it live" without a commit.

---

# TRACK 5 — SELL & SCALE

## 17. Stage 12 — Marketing site, pricing and listings

**Goal.** A site that makes a buyer believe the product is complete, a pricing shape the founder can defend, and the product findable where buyers look.

**Agent does.**
1. Budget **three versions** of the site; expect v1 to be rejected.
   - v1: text + one capture per section.
   - v2: real captures, security page, about page, comparison pages.
   - v3: breadth — menus mapping every module, interactive hero, scroll-driven workflow, many captures (dialogs, mobile, dark mode), every product page on one shared template.
2. **Captures are real**, taken by script from the demo workspace, re-taken after visual changes. No mock-ups.
3. **Price visibility decided once and applied everywhere:**
   - Public: pricing page with calculator, structured-data offers.
   - Sales-led: no price on site, in product, structured data or any customer PDF; "Talk to sales" everywhere; contact submissions stored as leads; self-serve checkout built but behind a flag.
4. **Plans around the unit the customer counts** (records, seats, items processed). Seats included; extra seats as cheaper add-on. **Enforce every limit in code** from the first day a plan exists, with clear upgrade prompts at the limit (never silent failure).
5. **Legal pages before the first payment:** privacy policy (what data, why, retention, processors incl. AI providers, user rights, grievance officer contact for India), terms of service, refund/cancellation policy, cookie notice if using non-essential cookies. Founder approves final text (ideally reviewed by a lawyer).
6. **Search layer:** sitemap, robots, canonical URLs, structured data (organisation, product, FAQ), fast pages (Core Web Vitals), comparison pages with dated facts, free public tools using the AI layer with per-IP limits, glossary, templates, changelog, blog/guides.
7. **Analytics funnel:** visit → sign-up → activation (define the "aha" event) → paid → retained. Consent-aware. Founder can read it weekly.
8. **Press kit** (logos, captures, boilerplate, zip) and a **listings document** with per-platform copy so the founder can create marketplace accounts quickly. The agent never creates those accounts.

**🛑 ASK.** Price visibility. Plans, units, limits, prices, trial length. Legal text approval. Which competitors to name. Site version approval.

**Gate.** The founder shows the site to a buyer in the target segment and is **not** asked "is this live yet?"

**Don'ts.** No fake testimonials, logos, user counts or metrics. No invented comparison facts. No prices anywhere if sales-led.

---

## 18. Stage 13 — First customers: make ten real before the first stranger

**Goal.** Ten workspaces holding real customer data, each built in under an hour, handed over without a single accidental email.

**Agent does.**
1. Start with people who already trust the founder (existing clients, partners, own teams). Build their workspace from **their real records**, not a demo.
2. After the second customer, **script the import** (five steps):
   1. Export from the old system, printing **counts only**.
   2. Import into a new workspace with a **placeholder owner** (`owner+<ws>@example.com`) plus the one internal person who serves that customer.
   3. Attach files by name; reset anything missing so nothing waits forever.
   4. Run expensive processing through the bulk path; report the split (done / review / failed / none).
   5. Mail the workspace link and logins **to the founder only**.
3. Real owner contacts are added only when the founder supplies them. Look for contacts where the customer actually logs in, not only in company records.
4. Every real contact on the **do-not-send list** until the founder says "hand over". Audit the mail log for any send to a customer domain before saying none went out.
5. Passwords for imported users live in files (one per workspace), read from disk, never pasted in chat. Prefer "set your password" links at handover.
6. **Onboarding:** time-to-"aha" under 2 minutes; sample-data switch; guided tour; empty states that teach; first-week emails (founder approves copy).
7. **Support:** help email/chat, in-app help, status page, known-issues list; a feedback button that creates a lead/ticket in admin.
8. **Sales kit:** walkthrough PDF from captures (generic + client-specific with their data), plan and product sheets (no prices if sales-led), one demo workspace per segment with a story a presenter can tell in 12 minutes. Demo people are fictional at example domains.
9. **Data rights:** workspace export (CSV/JSON + files) and deletion flow (with grace period) working before handover.

**🛑 ASK.** Which customers, in what order. Real owner contacts. Go for handover per customer (this lifts do-not-send). Onboarding email copy.

**Gate.** The eleventh customer's workspace takes under an hour, and the founder can name every email the product sent in the last week (from the mail log).

**Don'ts.** Never email a real contact before handover. Never import real data into the demo or QA workspace. Never stop searching for a contact after the first empty place — look twice before saying it doesn't exist.

---

## 19. Stage 14 — Scale and cost: unit economics before infrastructure

**Goal.** Every scaling question answered with a number per unit before any architecture change.

**Agent does.**
1. Define the **unit** of each expensive action (document processed, message sent, report generated, active seat) and its cost on every path, from the run records (§12).
2. **Cheapest levers first, each measured:** batch instead of online; leaner output; cache across workspaces; process on demand instead of at import; compress/resize files; cheaper tier for easy cases.
3. **Load test** before the first big customer and before launches: k6/Locust on staging with production-like data at **3× expected peak**; record p50/p95/p99 latency, error rate, DB CPU, connections, queue lag. Write results to `docs/CAPACITY.md`.
4. **Fix in this order** when a limit appears: missing indexes → N+1 queries → unbounded queries (paginate everything) → slow endpoints moved to the queue → caching (read-heavy, with explicit invalidation) → connection pooling → vertical scale (bigger box) → horizontal scale (second app box; servers are stateless; sessions in DB/Redis; files in object storage) → read replica → only then bigger architecture changes.
5. **Build-vs-buy threshold as a number:** the volume at which running your own model/service is cheaper than the provider, including gold set, training, accuracy target and operations. Below it, defer and say so.
6. Always-on capacity for predictable load; serverless/batch for bursts; neither until the threshold is crossed.
7. When a bill looks wrong, find which product/environment it belongs to before optimising.
8. Provider **quota** is the real ceiling — keep model-level fallbacks within the primary provider.
9. Per-workspace fairness: a single heavy customer must not slow others (per-workspace queue concurrency, rate limits, priority lanes).

**🛑 ASK.** Spend approvals for bigger infrastructure. Pricing changes driven by unit cost.

**Artifacts.** Cost-per-unit table · levers list with measured effects · load test results · threshold note · capacity note.

**Gate.** Asked "what if a customer brings 10× the volume?", the founder answers with a rupee figure and a lever, not a shrug.

**Don'ts.** Never add infrastructure before a measurement demands it. Never build a model server before a gold set exists.

---

# 20. CHECKLISTS (run every time)

## 20.1 Definition of done — every slice/screen
- [ ] Acceptance criteria met; tests written first, failed first, now pass.
- [ ] Typecheck, lint, unit + integration tests green in CI.
- [ ] Authorization tests added for every new resource/action.
- [ ] Empty, loading, error, and "no permission" states designed and shown.
- [ ] Works in light and dark; at 375px, 768px, 1280px; no horizontal overflow.
- [ ] Keyboard: tab order, focus visible, Enter/Escape behave, dialogs trap focus.
- [ ] Accessible names on inputs/buttons; contrast passes; images have alt text.
- [ ] No console errors; no failed network requests in the happy path.
- [ ] Copy uses approved vocabulary; no banned words; no placeholder text.
- [ ] Verified in a real browser with a named record.
- [ ] Browser check added to the suite.
- [ ] Audit rows written for mutations; notifications per catalogue.
- [ ] Diff self-reviewed; no secrets, debug logs, TODOs without an issue.
- [ ] Report lists assumptions and what was NOT tested.

## 20.2 Edge cases — for anything that writes data or handles input
**Submissions & concurrency**
- [ ] Double click / double submit → button disabled while pending **and** server idempotency key.
- [ ] Two users edit the same record → optimistic locking (version column) with a clear "changed by someone else" message.
- [ ] Two requests create the same unique thing → DB unique constraint + friendly error.
- [ ] Multi-step write → single DB transaction; no partial state.
- [ ] Background job runs twice → idempotent.

**Network & failures**
- [ ] Slow network → loading state; request timeout; user can retry safely.
- [ ] Request fails midway → no partial data; clear message; retry safe.
- [ ] Third-party down → queued/retried; user told plainly; no crash.
- [ ] Offline/refresh mid-form → unsaved-changes warning or draft saved.

**Input**
- [ ] Empty, whitespace-only, very long (max lengths enforced server-side), very large file.
- [ ] Unicode: Hindi/Devanagari, emoji, RTL, combining characters; names with apostrophes/dots; single-word names.
- [ ] Indian formats: +91 phone numbers (with/without code, spaces), PIN codes, GSTIN/PAN format validation if collected, ₹ formatting with lakh/crore if the founder wants it.
- [ ] Emails: case-insensitive uniqueness, plus-addressing, trimmed.
- [ ] HTML/script in text fields is escaped on output; markdown sanitised.
- [ ] CSV/Excel import: wrong columns, extra columns, encoding (UTF-8 BOM), duplicates, formula injection (`=`, `+`, `-`, `@` prefixes escaped on export).
- [ ] Files: wrong type, renamed extension, zero bytes, password-protected PDF, huge image, malicious filename.

**Time**
- [ ] Stored in UTC, displayed in user timezone (default IST).
- [ ] Month-end, leap year, midnight boundaries, daylight saving for non-IST users.
- [ ] "Today"/"this week" computed in the workspace timezone.
- [ ] Trial/plan expiry exactly at boundaries.

**Lists & data volume**
- [ ] Pagination on every list and API; sensible max page size.
- [ ] 0 items, 1 item, 10,000 items render acceptably.
- [ ] Sorting and filtering are stable and indexed.

**Lifecycle**
- [ ] Deleted/archived records: references handled (soft delete where history matters).
- [ ] User removed from workspace mid-session → access revoked on next request.
- [ ] Plan downgraded below current usage → read-only over limit, never data loss.
- [ ] Invite to an email that already has an account / is already a member / was revoked.

## 20.3 Security — for every module
- [ ] Every request authenticated (except intended public routes).
- [ ] Every single-record read/write checks workspace + role via `can()` (no IDOR).
- [ ] Server-side validation on all inputs; unknown fields rejected.
- [ ] Output encoding; no raw HTML injection; CSP compatible.
- [ ] SQL only through the ORM/parameterised queries.
- [ ] File access only via signed, expiring URLs scoped to the workspace.
- [ ] Rate limits on anything public, auth-related, costly, or abusable.
- [ ] CSRF protection for cookie-authenticated mutations.
- [ ] No secrets in client bundles, logs, error messages, URLs.
- [ ] SSRF: any "fetch this URL" feature restricts schemes/hosts and blocks internal IP ranges.
- [ ] Open redirects blocked (whitelist redirect targets).
- [ ] Sensitive actions (password/email change, 2FA off, ownership transfer, API key creation) require re-authentication and send a notification.
- [ ] Admin routes gated by platform-admin + 2FA.
- [ ] Dependency audit and secret scan pass.
- [ ] Red-team pass in a fresh session done; findings are tests.

## 20.4 Multi-tenancy
- [ ] New table has `workspace_id` NOT NULL + index + FK, or is explicitly documented as global.
- [ ] Queries go through the scoped client.
- [ ] Unique constraints are per workspace where appropriate (`(workspace_id, code)`).
- [ ] Background jobs carry and enforce workspace ID.
- [ ] Caches keyed by workspace (except deliberate cross-workspace content caches that hold no tenant data).
- [ ] Exports, search, reports, notifications and emails can never include another workspace's data — tested.
- [ ] Workspace deletion removes/anonymises all its rows and files (and is tested).

## 20.5 Payments & billing
- [ ] Amounts calculated on the server from the plan catalogue; never from the browser.
- [ ] Money in integer paise; GST computed and shown correctly; rounding rules documented.
- [ ] Orders created server-side; payment verified via gateway signature **and** server-side fetch of payment status.
- [ ] Webhooks: signature verified, replay-protected, stored raw, processed idempotently by event ID, reconciled daily.
- [ ] Entitlements granted only by the single grant function, only after confirmed payment.
- [ ] Scenarios handled and tested: success; failure; user closes checkout; payment pending/late capture; duplicate webhook; webhook arrives before redirect; redirect without webhook; refund (full/partial); chargeback/dispute; subscription renewal success/failure with retries and grace period; card expiry; upgrade/downgrade with proration rules; cancellation (end of period vs immediate); trial → paid; trial expiry without payment; coupon/discount; plan price change for existing customers (grandfathering decision by founder).
- [ ] GST-compliant invoices (business name, GSTIN if B2B, HSN/SAC, tax split CGST/SGST/IGST by state) — founder confirms details with their accountant.
- [ ] Billing emails (receipt, failed payment, renewal reminder, cancellation) — founder approves copy.
- [ ] Test mode end to end before live; live switch needs founder go (§2.6).
- [ ] Dunning and access rules: what happens on day 1/3/7 of failed renewal.

## 20.6 AI features
- [ ] Called by tier; run record written; cost attributed to workspace.
- [ ] Credits/limits enforced before the call.
- [ ] Input cached by hash; output validated against schema.
- [ ] Timeout, retry, fallback model, user-visible status.
- [ ] Human can review/correct; "AI-generated" labelled where it matters.
- [ ] Prompt-injection safe: documents treated as data; no privileged action from model output without permission check.
- [ ] Gold set passes after any prompt/model change.
- [ ] Provider data-retention settings documented.

## 20.7 Email & notifications
- [ ] SPF, DKIM, DMARC aligned for the sending domain.
- [ ] Every send goes through `sendMail()` with log row and do-not-send preflight.
- [ ] Non-production can never reach real inboxes.
- [ ] Bounces and complaints auto-suppress.
- [ ] Transactional vs marketing separated; marketing has unsubscribe and honours it.
- [ ] Templates render in major clients; plain-text part present; links use the right environment domain.
- [ ] No sensitive data (passwords, OTP in subject lines, full documents) in emails.
- [ ] Rate-limited per recipient to avoid floods from bugs.

## 20.8 Performance (per module)
- [ ] Queries for lists use indexes (check query plans for new queries).
- [ ] No N+1 (check query counts in tests or logs).
- [ ] Heavy work (exports, imports, AI, emails, PDFs) in the queue, with progress.
- [ ] Pages: images optimised, code-split, no blocking third-party scripts.
- [ ] p95 server response for main screens under the NFR target on staging data volumes.

## 20.9 Pre-deploy (every deploy)
- [ ] CI green (types, lint, unit, integration, auth matrix, secret scan, dependency audit).
- [ ] Migrations reviewed; expand/contract respected; backup taken if risky.
- [ ] Feature flags set correctly for new risky features.
- [ ] Smoke on canary passes; browser suite passes after swap; rollback ready.
- [ ] Release noted in changelog; error tracking release tagged.

## 20.10 Do-not-send list
- [ ] Every real customer contact imported before handover is on it.
- [ ] Bounced and complained addresses are on it automatically.
- [ ] Removal from it only on founder instruction (handover) and recorded in `DECISIONS.md`.

## 20.11 Pre-launch (before the first stranger pays)
- [ ] All gates of Stages 1–11 demonstrated.
- [ ] Backups running; restore tested and timed.
- [ ] Alerts reach the founder's phone (tested by a fake alert).
- [ ] Load test at 3× expected launch peak passed.
- [ ] Security pass done; red-team findings fixed or accepted by founder in writing.
- [ ] Payments live-mode tested with a real small transaction and refunded (founder go).
- [ ] Legal pages live; privacy policy lists processors; grievance contact present.
- [ ] Data export and deletion work.
- [ ] Status page, support channel, known-issues list ready.
- [ ] Analytics funnel recording; "aha" event defined.
- [ ] Do-not-send list correct; mail log audited.
- [ ] Rollback rehearsed this week.

## 20.12 Accessibility (minimum)
- [ ] Semantic HTML; one `h1` per page; landmarks.
- [ ] All interactive elements reachable and operable by keyboard.
- [ ] Visible focus; no keyboard traps except intended dialog focus traps.
- [ ] Colour contrast AA; information not conveyed by colour alone.
- [ ] Form errors announced and linked to fields.
- [ ] Respects reduced-motion preference.

---

# 21. SCENARIO RUNBOOKS — what to do when…

### 21.1 A requirement is unclear
1. Check `DECISIONS.md`, acceptance criteria, `PLAN.md`.
2. If still unclear and customer-visible → ask (§3.2). Meanwhile build the parts that don't depend on the answer.
3. If purely technical → choose the safer option, note it in the report.

### 21.2 CI is red / the build is broken
1. Stop feature work. Main branch must be green.
2. Find the first failing commit; read the failure; fix forward or revert.
3. Never disable or skip tests to go green. If a test is wrong, fix it and report why.
4. Add a rule to `INCIDENT_RULES.md` if the cause could recur.

### 21.3 A flaky test
1. Reproduce (run 20×). Find the cause: timing, shared state, order dependence, network, time zone, randomness.
2. Fix the cause (deterministic waits on conditions, isolated data, fixed clocks/seeds).
3. If it can't be fixed now: quarantine it in a visible list in the report with an owner and date. Never silently skip.

### 21.4 Production is down or erroring
1. Confirm (uptime check, error tracker, logs). Tell the founder within minutes: what's affected, since when, what you're doing.
2. If the last deploy is the likely cause → **roll back first**, investigate second.
3. If infrastructure (disk full, DB down, memory) → follow runbook section; restore service.
4. Once stable: root cause, fix with a test, deploy, incident note (§22.10), one new rule in `INCIDENT_RULES.md`. Founder decides customer communication.

### 21.5 Data looks wrong or corrupted
1. Stop the process writing it (pause queue/feature flag off).
2. Take a dump immediately (preserve evidence).
3. Measure scope with counts (no personal data in chat): which workspaces, how many rows, since when.
4. Propose a fix script with dry-run output (counts before/after). **Founder go** before running on production (§2.6).
5. Verify after; add a test and a constraint that would have prevented it.

### 21.6 A secret is exposed (committed, logged, shown)
1. Tell the founder immediately (which secret type, where exposed — never repeat the value).
2. **Rotate** it (founder does console steps if needed); update the secrets file; redeploy.
3. Remove from the place exposed (logs, history if feasible — history rewrite needs founder go). Assume it is compromised regardless.
4. Check provider logs for misuse (unexpected usage/spend).
5. Add a guard (secret scanning rule, log redaction) and an incident rule.

### 21.7 Suspected security breach / data leak across workspaces
1. Contain: feature flag off / block the route / revoke sessions or keys as needed.
2. Preserve evidence (logs, dump). Tell the founder immediately with scope as counts.
3. Fix with an authorization test that fails before and passes after.
4. Founder decides notifications. Note: Indian law (DPDP Act and CERT-In rules) can impose notification duties and timelines — flag this to the founder to confirm with counsel; don't decide it yourself.
5. Incident note + rules.

### 21.8 Cost spike (AI, cloud, mail)
1. Identify which product/environment/workspace/task from run records and billing.
2. If runaway (loop, abuse, bug) → disable the path via flag or cap; tell the founder.
3. Fix the cause; add a cap/alert that would have caught it earlier.
4. Update the cost-per-unit table.

### 21.9 Third-party provider down (AI, mail, payments, storage)
1. Confirm via status page/health check.
2. Switch to fallback model/provider if configured; queue work for retry; show users a clear status.
3. Never drop data or charges silently; reconcile when it's back.

### 21.10 Payment mismatch (customer paid, no access — or access without payment)
1. Check gateway dashboard data via API (not chat screenshots of card data), webhook log, grant log.
2. Run the reconcile job for that workspace.
3. Fix via the single grant function only; audit row written.
4. Founder decides any refund or goodwill credit.

### 21.11 Email deliverability problems (spam folder, bounces, complaints)
1. Check SPF/DKIM/DMARC alignment, bounce/complaint rates, content, sending volume spikes.
2. Pause bulk/marketing sends; keep transactional.
3. Fix authentication/content; warm up volume gradually.

### 21.12 Abuse: spam sign-ups, scraping, free-tool abuse, credential stuffing
1. Rate limits tighter; bot protection (CAPTCHA/turnstile) on sign-up/public tools — founder approves UX impact.
2. Block patterns (IP ranges, disposable email domains) with care; log decisions.
3. Ensure abuse can't burn AI credits (caps per IP/account).

### 21.13 The agent made a mistake
1. Say so first, plainly: what happened, impact (with numbers), what you've already done.
2. Fix; add the test/guard that would have caught it; add an incident rule.
3. Never hide or minimise it.

### 21.14 The founder changes a locked decision
1. Restate the decision being changed and its original reason.
2. Estimate impact: code, data migration, copy, cost, timeline.
3. Record the new decision in `DECISIONS.md` with date and reason; update `PLAN.md`; proceed.

### 21.15 A customer asks for something below the cut line
1. Record it (customer, ask, reason) in the backlog with a count of how many asked.
2. Tell the founder in the next report; don't build it unless the founder moves it above the line.

### 21.16 Migration on live data
1. Write it as expand/contract. Test on a production-sized copy; time it.
2. Dump first; maintenance flag if needed; founder go for anything destructive.
3. Run; verify with counts and checks; keep the rollback path until verified.

### 21.17 Dependency vulnerability reported
1. Assess: is the vulnerable path reachable in our use? Severity?
2. Patch/upgrade on a branch; run full tests; deploy.
3. If no patch exists: mitigate (config, input restriction, feature flag) and record.

### 21.18 Performance regression
1. Measure (which route, p95 before/after, query counts).
2. Find cause (new query, missing index, N+1, payload size).
3. Fix with a test or check that guards it (query count assertion, perf budget).

### 21.19 Customer data deletion or export request
1. Verify the requester is the workspace owner (or the data subject, for personal data) through the product, not chat.
2. Export: run the export job; deliver via secure link to the owner.
3. Deletion: run the deletion job with grace period per policy; confirm with counts; audit row. Backups age out per retention (document this in the privacy policy).

### 21.20 Session started with no context / docs out of date
1. Do the Session Start ritual (§4.1).
2. Reconcile docs with code; list discrepancies; fix docs; tell the founder what was stale.

### 21.21 Running out of time in a session
1. Don't leave a half slice on main. Either finish to done or stash/branch it with a clear note.
2. Write the next step at the top of `NOTES.md`; send the loop report.

---

# 22. TEMPLATES

## 22.1 Decision log entry (`docs/DECISIONS.md`)
```
## D-012 — <title>
Date: YYYY-MM-DD   Decided by: Founder   Stage: 2
Decision: <what was chosen>
Options considered: A) … B) … C) …
Reason: <founder's reason, in their words if possible>
Affects: <modules, data model, pricing, copy>
Reopen only if: <condition>
```

## 22.2 Decision table (Stage 2)
| # | Decision | Agent recommendation (+ one reason) | Founder choice | Notes |
|---|---|---|---|---|
| 1 | Product shape | | | |
| 2 | First customer segment | | | |
| 3 | Phase-1 scope (stories) | | | |
| 4 | Cut line (NOT in phase 1) | | | |
| 5 | Stack | | | |
| 6 | AI stance & the one AI feature | | | |
| 7 | Hosting & region | | | |
| 8 | Auth methods, 2FA | | | |
| 9 | Pricing unit & plans | | | |
| 10 | Price visibility (public / sales-led) | | | |
| 11 | Languages / locale | | | |
| 12 | Compliance (DPDP, GST invoices, sector rules) | | | |
| 13 | Timeline for phase 1 | | | |
| 14 | Flip-test decision & how the model survives it | | | |

## 22.3 Loop report
```
LOOP REPORT — <date> — Stage <N> (<name>)  Gate status: <not met / met — evidence>
✅ Works (verified):
  - <feature> — <evidence: link / screenshot path / test counts / record name>
🧪 Tests: <unit X passed, integration Y, auth matrix Z, browser W>  CI: <green/red>
⚠️ Not tested / assumptions:
  - <…>
✂️ Cut or deferred (with reason):
  - <…>
🛑 Pending on founder:
  - <item> — why — exact steps (§22.9) — unblocks <…>
💰 Spend since last report: AI ₹… · infra ₹… · other ₹…
➡️ Next loop: <what>
```

## 22.4 `docs/ENGINEERING_GUIDE.md` skeleton
```
1. Decisions summary (link to DECISIONS.md) — "do not reopen without the owner"
2. Hosts & environments (root, app., admin., api., in., per-workspace)
3. Repo layout & module folder pattern
4. Tenancy rule & scoped client usage (with examples)
5. Permissions: roles, can(), how to add an action
6. Brand tokens & component rules; vocabulary & banned words; tone
7. Data conventions: UTC, money in paise, codes, soft delete, audit
8. Queue: job naming, retries, idempotency
9. AI layer: tiers, run records, caching, gold set location
10. Testing: layers, how to run, QA workspace, gotchas
11. Definition of done (§20.1)
12. Deploy: command, canary, rollback
13. Secrets: where they live, .env.example, never print
14. Gotchas (dated, one line each)
```

## 22.5 `docs/RUNBOOK.md` sections
```
Where things run · Deploy · Rollback · Logs · Database access (read-only first) · Migrations ·
Queue inspection & retry · Backups & restore (with last restore test date & duration) ·
Storage · Mail (send/receive, suppression) · Payments (reconcile, refunds) · AI providers (fallbacks, caps) ·
Each integration · Alerts & who gets them · Feature flags & kill switches · Common fixes · Incident log index
```

## 22.6 User story with acceptance criteria
```
Story S-07: As a <role>, I want <capability>, so that <outcome>.
Acceptance criteria:
  AC1: Given <state>, when <action>, then <result>.
  AC2: Given another workspace's record ID, when I request it, then I get "not found" (no data leak).
  AC3: Given I double-click Save, then exactly one record is created.
  AC4: Given the AI provider is down, then the item is queued and I see "processing will resume".
Out of scope: <…>
Must never: <…>
```

## 22.7 Spec draft (Stage 1)
```
Customer (one sentence): …
Job they hire us for (one sentence): …
Today they use: …   It hurts because: …   They pay today: …
Top 3 must-haves for the first 10 customers: 1… 2… 3…
Promised-but-dead list: …
Success for the customer looks like (measurable): …
Must never happen: …
Open questions for founder: …
```

## 22.8 Non-functional requirements
```
Users/workspaces: day 1 … · month 12 …   Peak concurrent users: …
Data volume: records/workspace … · files … GB
Latency target: p95 main screens < … ms
Availability target & acceptable downtime: …
Backup: RPO … · RTO …
Sensitive data held: …   Regions/data residency: …
Languages/locale: …   Accessibility: WCAG AA basics
Compliance: DPDP · GST invoices · sector-specific: …
Budget ceiling per month (infra + AI): ₹…
```

## 22.9 Console steps for the founder
```
FOUNDER STEPS — <service> (needed for: <what it unblocks>)
1. Go to <URL> and sign in / create account (you create it; I never do).
2. Click … → … (exact labels).
3. Set <field> to <value>.
4. Copy the <key name> and put it in the server secrets file as <VAR_NAME> (do not paste it in chat).
5. Tell me "done" — I'll verify with a health check and report the result.
Time needed: ~<n> minutes.   Cost: <free / ₹… / depends on usage>.
```

## 22.10 Incident note (`docs/INCIDENT_RULES.md` + runbook)
```
INC-004 — <date> — <title>
Impact: <who, how many (counts), how long>
Detected by: <alert / customer / agent>
Root cause: <…>
Fix: <commit/PR>
Guard added: <test / alert / constraint>
RULE: <one sentence the next session must follow>
```

## 22.11 Cost-per-unit table (`docs/COSTS.md`)
| Unit | Path | Provider/model | Avg tokens/size | Cost per unit (₹) | Measured on | Notes |
|---|---|---|---|---|---|---|

---

# 23. Defaults (proposed in Stage 2; founder confirms or overrides)

**Locale.** India-first: INR in integer paise; GST; IST display, UTC storage; en-IN copy (Hinglish only where the founder asks); +91 phone handling; DPDP Act basics (purpose per data item, consent where needed, grievance contact, user rights to access/correct/erase).

**Stack (boring, popular, one language).**
- TypeScript strict across the repo; one monorepo (`web`, `worker`, `db`).
- Web: Next.js (App Router) — marketing, product, admin and API in one app.
- Database: PostgreSQL; ORM with migrations (Prisma or Drizzle); queue in Postgres (e.g. pg-boss/graphile-worker).
- Auth: a maintained library or provider (e.g. Better Auth / Auth.js / Clerk) with email+password, Google sign-in, TOTP 2FA.
- Validation: Zod. UI: component library on design tokens (e.g. shadcn/ui + Tailwind with token mapping).
- Tests: Vitest (unit/integration), Playwright (browser), k6 (load), Semgrep + dependency audit + Gitleaks (security).
- Storage: S3-compatible (AWS S3 Mumbai / Cloudflare R2). Mail: AWS SES / Postmark / Resend (send + inbound). Payments: Razorpay (Stripe if selling abroad).
- Observability: Sentry (errors), uptime monitor, structured logs; PostHog for product analytics.
- Hosting: one VPS in an Indian region to start (Docker for Postgres + reverse proxy with automatic TLS, e.g. Caddy); DNS on Cloudflare.
- CI/CD: GitHub Actions; one-command deploy script with canary smoke and auto-rollback.

**Limits & safety defaults.**
- Session lifetime 30 days rolling, re-auth for sensitive actions.
- Upload limit 20 MB per file (adjust per product), allowed types whitelisted.
- Rate limits: auth endpoints 5/min/IP and 10/hour/account; public tools 20/hour/IP; AI endpoints per plan.
- Backups: nightly, 14 days on box, 90 days off box.
- Alert thresholds: error rate > 2% for 5 min, p95 > 2× target for 10 min, queue backlog > 15 min, disk > 80%, AI spend > 80% of daily cap.

---

# 24. Gate checklist (one page)

| # | Stage | Gate (must be demonstrated) | Evidence |
|---|---|---|---|
| 1 | Research | Founder names the 3 features the first 10 customers will demand | Audit pages, spec draft |
| 2 | Decide & lock | A stranger can say what ships and what doesn't | DECISIONS.md, PLAN.md, acceptance criteria |
| 3 | Brand | New screen built in the right look without a design question | Tokens file, vocabulary |
| 4 | Architecture | Sign-in over HTTPS on real domain; CI green; guide answers "where does X go" | Repo, CI, guide |
| 5 | Foundations | Sign up → workspace → invite → file → mail → audit, with zero feature code; cross-workspace access refused (tested) | Tests, schema |
| 6 | Slices | Founder walks the demo end to end; every screen finished | Commits, presets, reports |
| 7 | AI layer | Cost per unit known; provider swap = one variable; gold set passes | Run table, comparison table |
| 8 | Integrations | Trial user signs up, gets mail, uploads, replies, upgrades — unaided | Verified domains, gateway, reconcile job |
| 9 | Admin | Sales grants a trial from an email; founder reads AI spend — no agent needed | Admin host, grant function |
| 10 | Quality | Broken build refused; broken screen auto-rolls back; auth test catches removed filter | Deploy logs |
| 11 | Deploy & operate | New engineer deploys, rolls back, restores from backup with runbook only | Runbook, restore record |
| 12 | Marketing & pricing | Target buyer doesn't ask "is this live yet?" | Site v3, legal pages, price sheet |
| 13 | First customers | 11th workspace < 1 hour; every sent email known | Import scripts, mail log |
| 14 | Scale & cost | "10× volume?" answered with a ₹ figure and a lever | Cost table, load test |

---

# 25. The operating rules on one card

1. Founder decides anything a customer could notice; agent proposes with one recommendation and one reason.
2. Read this file and the project docs at the start of every session.
3. One complete, verified slice at a time. Tests first; they must fail first.
4. Every record lookup checks workspace and role. Every write handles double submit.
5. Secrets and personal data never enter the chat. Scripts print counts.
6. Nothing reaches a real person unless the founder sends it.
7. Irreversible actions need an explicit go, with a fresh backup.
8. Done means verified, with a number. List what you didn't test.
9. Cut, never drop. Never weaken a test to go green.
10. Never wait idle on the founder — build against the fallback.
11. Measure before scaling; cost per unit before infrastructure.
12. Write it down where the next session will trip on it.
