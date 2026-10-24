# PLAN.md — Campusly Phase 1

## What ships on the last day
A school owner signs up, creates a school, invites a teacher, parent and student, and runs the four modules:
**Students & classes, Attendance, Exams & report cards, Fees**. Each role sees only what it is allowed to see.
Every module has unit, integration, authorization-matrix and browser tests.

## What does NOT ship (cut line, named — playbook §7.3)
| Below the line | Why | What it would take |
|---|---|---|
| Stage 7 AI layer | No AI feature chosen | Pick the one AI feature; `ai.run({tier})`; gold set |
| Stage 8 live integrations: real email, payment gateway, file bucket | Founder accounts needed (§2.4) | Founder console steps; code already uses fallbacks |
| Google sign-in **keys** | Founder creates OAuth app | Add `GOOGLE_CLIENT_ID/SECRET` → button appears |
| 2FA (TOTP) | Founder: later | Better Auth `twoFactor` plugin |
| Stage 9 staff admin console | Depth choice | `admin.` host, platform-admin table, grant function |
| Stage 11 deploy, backups, alerts | Depth choice | Deploy script with canary + rollback, nightly dump |
| Stage 12 marketing site, pricing | Depth choice | Site v1–v3, legal pages |
| Stage 13 onboarding/import | Depth choice | CSV import script, sample-data switch |
| Stage 14 load/cost | Depth choice | k6 at 3× peak, `docs/CAPACITY.md` |
| Background queue, notifications, feature flags (Stage 5 parts) | No phase-1 feature needs them | pg-boss on the same Postgres when the first async job appears |
| Timetable, transport, library, payroll | Not chosen | Separate module each |

## Data model sketch
All tenant tables carry `school_id` (NOT NULL, FK, indexed). Global tables: Better Auth's `user`, `session`,
`account`, `verification`; `plan`.

```
plan(id, name, limit_kind['students'|'schools'], limit_value)
school(id, name, slug UNIQUE, currency, timezone, plan_id)
membership(id, school_id, user_id, role[owner|admin|teacher|parent|student]) UNIQUE(school_id,user_id)
invitation(id, school_id, email, role, student_id?, token_hash, expires_at, accepted_at, revoked_at)
class(id, school_id, name, teacher_membership_id?) UNIQUE(school_id,name)
student(id, school_id, code 'STU-0001', first_name, last_name, date_of_birth, class_id?, user_id?) UNIQUE(school_id,code)
guardian(school_id, student_id, user_id) PK(student_id,user_id)
attendance(id, school_id, student_id, class_id, on_date, status[present|absent|late], marked_by) UNIQUE(student_id,on_date)
exam(id, school_id, class_id, name, subject, max_marks, held_on)
mark(id, school_id, exam_id, student_id, score) UNIQUE(exam_id,student_id)
invoice(id, school_id, code 'INV-0001', student_id, description, amount_minor, currency, due_on, version)
payment(id, school_id, invoice_id, amount_minor, paid_on, method, idempotency_key UNIQUE)
document(id, school_id, student_id, filename, mime, size, storage_key)
counter(school_id, kind, value) PK(school_id,kind)      -- human codes, max+1 under row lock
audit_log(id, school_id?, actor_user_id, action, entity, entity_id, before, after, ip, at)
mail_log(id, to_masked, to_hash, subject, template, status['dry-run'|'sent'|'blocked'], at)
```

## Roles × actions (the `can()` table)
| Action | owner | admin | teacher | parent | student |
|---|---|---|---|---|---|
| school.settings | ✅ | ✅ | | | |
| member.invite | ✅ | ✅ | | | |
| class.manage | ✅ | ✅ | | | |
| student.manage | ✅ | ✅ | | | |
| student.view | all | all | own classes | own children | self |
| attendance.mark | ✅ | ✅ | own classes | | |
| exam.manage / mark.enter | ✅ | ✅ | own classes | | |
| reportcard.view | all | all | own classes | own children | self |
| fee.manage | ✅ | ✅ | | | |
| fee.view | all | all | | own children | self |
| audit.view | ✅ | ✅ | | | |

## User stories with acceptance criteria (§22.6) — these become tests

**S-01 Sign up & create school.** As a school owner, I want to sign up and create my school, so that I have a workspace.
- AC1: Given a new email, when I sign up and create "Maple Grove", then I am its owner and land on its dashboard.
- AC2: Given an email already registered (any case), when I sign up, then I see "account exists".
- AC3: Given I am signed out, when I open any school page, then I am sent to sign-in.

**S-02 Invite members.** As an admin, I want to invite a teacher/parent/student by email, so that they can sign in.
- AC1: Given an invite, when the invitee signs up with that email and opens the link, then they join with that role.
- AC2: Given an expired, revoked, already-used invite, or a different email, then acceptance is refused.
- AC3: The invite mail appears in the mail log as `dry-run`; no real mail is sent.
- AC4: A parent invite is linked to a student; on accept the parent becomes that student's guardian.

**S-03 Classes & students.** As an admin, I want to create classes and admit students, so that records exist.
- AC1: Given a class "Grade 5-A", when I admit a student, then they get the next code (STU-0001, STU-0002…).
- AC2: Given two admissions at the same time, then codes are unique and sequential.
- AC3: Given the plan's student limit is reached, then admission is refused with an upgrade message.
- AC4: Given another school's student ID, when I request it, then I get "not found".
- AC5: Names with apostrophes, accents, Devanagari, emoji are stored and shown exactly; HTML is escaped.

**S-04 Attendance.** As a teacher, I want to mark today's attendance for my class, so that parents know.
- AC1: Given my class, when I mark statuses and save, then one row per student for that date exists.
- AC2: Given I save twice (double submit or edit), then rows are updated, never duplicated.
- AC3: Given a class I don't teach, then marking is refused.
- AC4: "Today" is the school's timezone date, not the server's.
- AC5: Attendance % per student = (present + late) / marked days, shown as whole percent; 0 marked days shows "—".

**S-05 Exams & report cards.** As a teacher, I want to create an exam and enter marks; parents/students see report cards.
- AC1: Given an exam with max 100, when I enter 105 or -1, then it is rejected.
- AC2: Report card shows each exam's score, percentage, and overall percentage = sum(scores)/sum(max).
- AC3: A parent sees only their children's report cards; a student only their own.
- AC4: No NaN/undefined/Infinity on a report card with zero exams.

**S-06 Fees.** As an admin, I want to bill students and record payments, so that dues are tracked.
- AC1: Amounts are entered as decimals in the school currency and stored as integer minor units.
- AC2: Given a double-click on "Record payment", then exactly one payment is stored (idempotency key).
- AC3: Status is derived: unpaid / partial / paid; overpayment is refused.
- AC4: Parents see their children's invoices; teachers see none.

**S-07 Documents (files foundation).** As an admin, I want to upload a student's document (PDF/PNG/JPG ≤ 5 MB).
- AC1: Allowed types are checked by magic bytes, not extension; a renamed .exe is refused.
- AC2: Downloads use a signed URL that expires in 5 minutes and is bound to the school.

**S-08 Audit.** Every mutation writes an audit row (who, what, before/after, when); admins can view it.

## Slice order (§5)
1. Foundations: schema, scoped client, `can()`, auth, school + membership, audit, mail log, codes (S-01)
2. Invitations (S-02)
3. Classes & students + documents (S-03, S-07)
4. Attendance (S-04)
5. Exams & report cards (S-05)
6. Fees (S-06)
7. Audit viewer + demo seed + browser suite (S-08)
