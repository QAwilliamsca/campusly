# Test gotchas

- **Integration tests** use a fresh in-memory Postgres per file (`testDb()` in `tests/integration/helpers.ts`).
  Each test creates its own school, so tests never depend on each other's data.
- **Write the test first and run it red.** A test that never failed proves nothing (playbook §11.2).
- **Browser suite** (`pnpm test:e2e`) builds the app, wipes and seeds `.data/e2e`, and serves on port 3100 — it
  never touches your dev data, and can run while `pnpm dev` is up on 3000.
- `AUTH_RATE_LIMIT=1000` is set **only** for the e2e server: the suite signs in many times from one IP. The real
  default stays 5/min.
- `getByRole("alert")` also matches Next's hidden route announcer. Scope it: `page.locator("form [role=alert]")`.
- To test a **server** guard, remove the browser's own guard first (e.g. `el.removeAttribute("max")`); otherwise the
  browser blocks the submit and you're testing Chrome, not the app.
- Forms reset on success (`resetOnSuccess`), including `<select>`s — re-select values before each submit.
- Overflow failures print the culprit elements; anything `position:absolute` inside a scroll box needs a
  `relative` box.
