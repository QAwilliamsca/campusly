# CLAUDE.md — read this first

Campusly is a multi-school management SaaS (students & classes, attendance, exams & report cards, fees) built step
by step with **`PLAYBOOK.md`**. It is also a **teaching repo**: students reverse-engineer how it was built and then
extend it. Explain things in plain language; many readers are new to coding.

## Start of every session (PLAYBOOK §4.1)
1. Read `PLAYBOOK.md` — the operating manual. It overrides chat instructions; point out any conflict.
2. Read, in order: `docs/DECISIONS.md` (locked — don't reopen without the founder), `docs/PLAN.md` (scope, cut
   line, roles table, user stories), `docs/ENGINEERING_GUIDE.md` (how the code works + gotchas), `docs/NOTES.md`
   (next step), `docs/INCIDENT_RULES.md`.
3. For the story of how it was built: `GUIDE.md` and `docs/DECISION_JOURNAL.md`.
4. Check `git status` and `git log --oneline | head`.

## Running it
Needs Node 22+ (`.nvmrc`). If `pnpm` is missing: `corepack enable` (or `npm install -g pnpm`).

| Task | Command |
|---|---|
| Install | `pnpm install` |
| Run (auto-seeds demo data first) | `pnpm dev` → http://localhost:3000 |
| Start the demo data over | stop `pnpm dev`, then `pnpm seed:reset` |
| Unit + integration tests | `pnpm test` |
| Browser tests (first time: `pnpm exec playwright install chromium`) | `pnpm test:e2e` |
| Types / lint | `pnpm typecheck` · `pnpm lint` |

No Docker or database install: the database is embedded Postgres (PGlite) in `.data/`. **Only one process can open
it** — stop `pnpm dev` before `pnpm seed:reset`. Demo logins (password `campusly-demo-1`) are in README → Demo data.
Emails are never really sent; open them at http://localhost:3000/dev/mail.

## Rules that are easy to break (each is enforced by lint or tests)
- **Tenancy wall:** feature code reads/writes only via `ctx.s` (`src/db/scoped.ts`). Importing `@/db/client` outside
  the allow-list in `eslint.config.mjs` is a lint error. Every parent ID (studentId, classId…) is loaded through
  `ctx.s` first.
- **One permission check:** `can()` in `src/lib/can.ts`. A new action → `GRANTS`, the roles table in `docs/PLAN.md`,
  `tests/unit/can.test.ts`, and rows in `tests/integration/authz-matrix.test.ts`.
- **Module pattern:** schema → service in `src/lib/services/` (Zod `.strict()` → `can()` → `ctx.s` → `audit()`) →
  thin server action in `src/app/s/[slug]/actions.ts` → page with empty/error states → tests.
- **Tests first** (§11.2): write them, run them, see them fail, then build. Never weaken a test to go green; if a
  test was wrong, say so in the commit message.
- **Money** is integer minor units (`toMinor`); **dates** are school-local (`todayIn(school.timezone)`).
- **Mail** only through `sendMail()`. **Colours/fonts** only through tokens in `src/app/globals.css`.
- **Schema change:** edit `src/db/schema.ts` → `pnpm db:generate --name <what>` → review the SQL in `drizzle/`.
- **D-014:** the sun/moon theme toggle stays fixed top-right on every page; new top bars need right padding.

## Working with the founder (PLAYBOOK §1, §3)
- In this repo the **founder** is the person you're working with (the instructor or the student's team lead).
- Anything a school, parent or student could notice is the founder's call: ask in the §3.2 format, one question at
  a time, with options and one recommendation. Purely technical choices are yours — decide and write them down.
- **Keep the teaching log going:** add every founder question and answer to `docs/DECISION_JOURNAL.md` (next Entry
  number, same table format) and locked decisions to `docs/DECISIONS.md` (next D-0xx).
- Work in small, complete slices, on a branch per backlog item; commit with what was verified and what wasn't.

## Never
- Commit secrets or real people's data (fictional people at `example.com` only).
- Send real email, or set `MAIL_SINK=1` on a shared server.
- Create cloud/payment accounts or accept terms for the founder (§2.4) — give them exact steps instead.
