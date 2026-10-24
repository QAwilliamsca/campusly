# NOTES.md

## ➡️ Next step (start here next session)
1. Push to GitHub (founder creates the repo; decides public vs private — see journal Entry 9) and confirm CI is
   green on the first run. Codespaces setup is written but not yet tried in a real codespace.
2. Red-team #7 (client-IP header) and invite-volume limits (#12) are deferred to Stages 11 and 8 (see RUNBOOK).
3. Founder items: domain/trademark check for "Campusly"; Google OAuth keys (RUNBOOK); decide 2FA timing.
4. Next slices below the cut line, in the order schools will notice them: real email (Stage 8) → backups and deploy
   (Stage 11) → CSV student import (Stage 13).

## Facts the code can't hold
- Demo users live only in local/e2e databases, created by `scripts/seed.ts`; password from `DEMO_PASSWORD`.
- Accepted risk: esbuild ≤0.24 moderate advisory (dev-server CORS) via better-auth → drizzle-kit. Not reachable:
  we never run esbuild's serve mode. CI audits at `high`. Re-check when drizzle-kit updates.
- Git identity in this repo was set to "Instructor <instructor@syntaxtechs.com>" (repo-local config) because the
  machine had none.
