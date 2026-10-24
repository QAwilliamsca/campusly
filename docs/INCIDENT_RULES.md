# INCIDENT_RULES.md

One rule per incident or near-miss (playbook §22.10). These happened during the build, caught by tests.

INC-001 — 2026-10-24 — Document list answered "empty" for another school's student
Impact: none (caught by the authorization matrix before commit); 0 rows leaked.
Detected by: tests/integration/authz-matrix.test.ts ("document.list refused for otherSchool").
Root cause: `listDocuments` filtered by school but never checked the student exists in that school.
Fix: commit c7e7228 — check the student through the scoped client first, else not found.
Guard added: authz matrix row.
RULE: Every service that takes a parent ID (studentId, classId, examId) must load the parent through `ctx.s` first.

INC-002 — 2026-10-24 — Forbidden pages returned HTTP 200 instead of 404
Impact: none for data (the page body was "Not found"); status code wrong on every `/s/[slug]` page.
Detected by: tests/e2e/roles.spec.ts.
Root cause: `loading.tsx` makes the route stream; `notFound()` after the stream starts cannot change the status.
Fix: commit 0bbcc0e — removed `src/app/s/[slug]/loading.tsx`; pending state moved to nav links.
RULE: Don't add `loading.tsx` above pages that call `notFound()` for permission checks.

INC-003 — 2026-10-24 — Fees page overflowed at 375px in the production build
Impact: horizontal page scroll on phones (669px).
Detected by: tests/e2e/roles.spec.ts overflow check.
Root cause: `sr-only` labels are `position:absolute`; their containing block was the page, not the table's scroll box.
Fix: commit 0bbcc0e — `TableWrap` is `position: relative`.
RULE: Every horizontal scroll container must be `relative`.
