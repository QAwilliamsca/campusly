# RUNBOOK.md — operating Campusly

Phase 1 is local-only, so most production sections are placeholders that name what Stage 11 must add.

## Where things run
| Thing | Local | Production (Stage 11, not built) |
|---|---|---|
| App | `pnpm dev` (port 3000) | `pnpm build && pnpm start` behind a TLS proxy |
| Database | PGlite in `.data/pglite` | Postgres via `DATABASE_URL` |
| Files | `.data/uploads` | Private object-storage bucket |
| Mail | Dry run → `mail_log` + console; view at `/dev/mail` | Provider (Stage 8) |

## First run
```bash
pnpm install
pnpm seed      # demo school; dev server must be stopped
pnpm dev       # http://localhost:3000
```

## Reset local data
Stop the dev server, then delete `.data/` and run `pnpm seed`. (Local only — never on a real database.)

## Logs
Server console. Unexpected errors print `[error ref=xxxxxxxx]` with the stack; users see the same ref.
Mail lines print as `[mail:dry-run] <template> → a***@domain`.

## Database access
Local: stop the server, then open a script with `connect({ dir: ".data/pglite" })` from `src/db/connect.ts`.
Read-only first. Never run ad-hoc writes against real data (playbook §2.6).

## Migrations
1. Edit `src/db/schema.ts`. 2. `pnpm db:generate --name <what>`. 3. Review the SQL in `drizzle/`.
4. It applies automatically on next start (`connect()` runs the migrator). Forward-only; expand/contract for
breaking changes.

## Backups & restore
**Not built** (Stage 11). Before the first real school: nightly `pg_dump`, off-box copy, a restore test with timing.

## Mail
Every send goes through `sendMail()` (`src/lib/mail.ts`) and is a dry run. Count sends:
`select template, count(*) from mail_log group by 1;`

## Google sign-in (founder steps, playbook §22.9)
```
FOUNDER STEPS — Google OAuth (needed for: "Continue with Google" button)
1. Go to https://console.cloud.google.com and sign in / create a project (you create it; the agent never does).
2. APIs & Services → OAuth consent screen → External → app name "Campusly", your support email → Save.
3. Credentials → Create credentials → OAuth client ID → Web application.
4. Authorized redirect URI: http://localhost:3000/api/auth/callback/google (add the production URL later).
5. Put the Client ID and Client secret in .env as GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (do not paste them in chat).
6. Restart the app — the button appears on /sign-in. Tell me "done" and I'll verify the sign-in round trip.
Time needed: ~10 minutes.   Cost: free.
```

## Before the first public deploy (from the red-team review)
- **Client IP for rate limits (red-team #7):** put the app behind a proxy that *overwrites* `X-Forwarded-For`, and
  set Better Auth `advanced.ipAddress` to trust only that header. Otherwise the 5/min sign-in limit can be dodged.
- **Never set `MAIL_SINK=1`** on a shared server: the sink shows every reset link.
- **Signed file links (red-team #13, accepted):** valid for 5 minutes for whoever holds them. Don't paste them into chats.

## Feature flags & kill switches
None in phase 1 (cut). Fastest kill switch today: remove the nav link + `notFound()` at the top of the page.

## Incident log index
See [`INCIDENT_RULES.md`](INCIDENT_RULES.md).
