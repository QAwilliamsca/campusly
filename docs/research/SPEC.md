# Stage 1 — Research artifacts

## Spec draft (playbook §22.7)
- **Customer (one sentence):** Schools that run admissions, attendance, marks and fees on paper or spreadsheets.
- **Job they hire us for:** One place where admins, teachers, parents and students see the same, correct record
  of each student's attendance, marks and fees.
- **Today they use:** Registers, spreadsheets, chat groups. **It hurts because:** records disagree, parents
  find out late, fee follow-up is manual. **They pay today:** staff time.
- **Top must-haves for the first 10 customers:** 1) Students & classes 2) Attendance 3) Exams & report cards
  4) Fees (founder added a fourth).
- **Promised-but-dead list:** none — no legacy product exists.
- **Success for the customer (measurable):** a teacher marks a class's attendance in under 1 minute; a parent
  sees today's attendance the same day; a report card needs zero spreadsheet work.

## Must never happen
1. A user from School A sees any record of School B.
2. A parent sees a child who isn't theirs; a student sees another student's marks.
3. A teacher edits attendance or marks for a class they don't teach.
4. An email reaches a real person from a non-production environment.
5. A payment is recorded twice from a double click.
6. Money is stored or summed as a floating-point number.

## Non-functional requirements (§22.8)
- Users/workspaces: day 1 — 1 demo school · month 12 — ~50 schools (assumption, not founder-confirmed)
- Data volume: ~1,000 students/school; ~200 school days × students attendance rows/year
- Latency target: p95 main screens < 500 ms locally
- Availability / backup: not applicable in phase 1 (Stage 11 cut)
- Sensitive data held: minors' names, dates of birth, guardian emails — treat as personal data (§2.2)
- Locale: generic; per-school currency + timezone · Accessibility: WCAG AA basics

## Seed data list
- Demo school "Maple Grove School" with fictional people at `example.com`, 2 classes, 10 students,
  1 teacher, 1 parent, 1 student login. Used by browser tests and demos.

## Competitor check
✂️ **Cut (not done):** requires web research of competitor pricing; deferred because pricing is below the cut
line. Named here so it isn't forgotten (§2.7).
