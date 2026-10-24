/**
 * Demo preset (PLAYBOOK §11 "Demo data"): fictional people at example.com, enough data
 * that every screen has something to show for every role, plus deliberate empty states.
 * Uses the real services, so audit rows exist exactly as in real use.
 * Prints counts only (PLAYBOOK §2.2). Run while the dev server is STOPPED (PGlite is single-process).
 *
 *   pnpm seed          # creates the demo schools if missing (also runs automatically before `pnpm dev`)
 *   pnpm seed:reset    # wipes local data first, then seeds (works on Windows too — no `rm -rf`)
 *
 * Every account and what to try with it: README.md → "Demo data".
 */
import { rmSync } from "node:fs";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { connect, type DB } from "../src/db/connect";
import { account, guardian, membership, school, student, user, type Role } from "../src/db/schema";
import { loadCtx, type Ctx } from "../src/lib/context";
import { createSchool } from "../src/lib/services/schools";
import { assignTeacher, createClass } from "../src/lib/services/classes";
import { admitStudent, type Student } from "../src/lib/services/students";
import { markAttendance } from "../src/lib/services/attendance";
import { createExam, enterMarks } from "../src/lib/services/exams";
import { billClass, createInvoice, listInvoices, recordPayment } from "../src/lib/services/fees";
import { uploadDocument } from "../src/lib/services/documents";
import { inviteMember } from "../src/lib/services/members";
import { todayIn } from "../src/lib/time";

const PASSWORD = process.env.DEMO_PASSWORD || "campusly-demo-1";

type Person = { id: string; name: string; email: string };

async function makeUser(db: DB, name: string, email: string): Promise<Person> {
  const id = crypto.randomUUID();
  await db.insert(user).values({ id, name, email, emailVerified: true });
  await db.insert(account).values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: await hashPassword(PASSWORD) });
  return { id, name, email };
}

async function join(db: DB, ctx: Ctx, person: Person, role: Role) {
  const [m] = await db.insert(membership).values({ schoolId: ctx.school.id, userId: person.id, role }).returning();
  return m!;
}

const shift = (date: string, days: number) => new Date(Date.parse(date) - days * 86_400_000).toISOString().slice(0, 10);
const isWeekday = (date: string) => ![0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay());

/** The last `n` school days (Mon–Fri) before today, oldest first. */
function schoolDays(today: string, n: number) {
  const out: string[] = [];
  for (let back = 1; out.length < n; back++) if (isWeekday(shift(today, back))) out.unshift(shift(today, back));
  return out;
}

// Deterministic attendance patterns, one per student, so percentages vary but never change between runs.
const PATTERNS = ["PPPPPPPPPP", "PPPLPPPPPA", "PAPPLPPAPP", "PPPPPPLPPP", "APAPPAPLPA", "PPLPPPPPPP", "PPPPAPPPPP", "LLPPPPLPPP"];
const statusAt = (student: number, day: number) => ({ P: "present", A: "absent", L: "late" })[PATTERNS[student % PATTERNS.length]![day % 10]!] as "present" | "absent" | "late";

async function attendanceHistory(ctx: Ctx, classId: string, roster: Student[], days: string[]) {
  for (const [d, date] of days.entries()) {
    await markAttendance(ctx, { classId, date, entries: roster.map((s, i) => ({ studentId: s.id, status: statusAt(i, d) })) });
  }
}

const PDF = new TextEncoder().encode("%PDF-1.4\n% Campusly demo document — fictional\n1 0 obj <<>> endobj\ntrailer <<>>\n%%EOF\n");
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52]);

async function mapleGrove(db: DB) {
  const TZ = "America/New_York";
  const today = todayIn(TZ);
  const days = schoolDays(today, 20);

  const p = {
    principal: await makeUser(db, "Priya Natarajan", "principal@example.com"),
    admin: await makeUser(db, "Hannah Lee", "admin@example.com"),
    teacher: await makeUser(db, "Daniel Okafor", "teacher@example.com"),
    teacher2: await makeUser(db, "Samuel Mensah", "teacher2@example.com"),
    newTeacher: await makeUser(db, "Olivia Chen", "newteacher@example.com"),
    parent: await makeUser(db, "Maria Santos", "parent@example.com"),
    parent2: await makeUser(db, "James Khan", "parent2@example.com"),
    newParent: await makeUser(db, "Rita Gomez", "newparent@example.com"),
    student: await makeUser(db, "Leo Santos", "student@example.com"),
    student2: await makeUser(db, "Aisha Khan", "student2@example.com"),
  };

  const sch = await createSchool(db, p.principal, { name: "Maple Grove School", currency: "USD", timezone: TZ });
  const owner = (await loadCtx(db, p.principal, sch.slug))!;
  await join(db, owner, p.admin, "admin");
  const t1 = await join(db, owner, p.teacher, "teacher");
  const t2 = await join(db, owner, p.teacher2, "teacher");
  await join(db, owner, p.newTeacher, "teacher"); // teaches nothing yet → empty states
  for (const who of [p.parent, p.parent2, p.newParent]) await join(db, owner, who, "parent"); // newParent: no child linked
  for (const who of [p.student, p.student2]) await join(db, owner, who, "student");
  const admin = (await loadCtx(db, p.admin, sch.slug))!;

  // Classes: two taught, one empty and unassigned (empty-class states on Attendance / Fees).
  const g5 = await createClass(owner, { name: "Grade 5-A" });
  const g6 = await createClass(owner, { name: "Grade 6-B" });
  await createClass(admin, { name: "Grade 7-C" });
  await assignTeacher(owner, { classId: g5.id, teacherMembershipId: t1.id });
  await assignTeacher(admin, { classId: g6.id, teacherMembershipId: t2.id });

  // Students — unicode, apostrophes, Devanagari on purpose (§20.2). Grade 5-A has exactly 6 (browser tests rely on it).
  const admit = (firstName: string, lastName: string, classId: string | null, dateOfBirth: string) => admitStudent(owner, { firstName, lastName, classId, dateOfBirth });
  const g5kids = [
    await admit("Leo", "Santos", g5.id, "2015-03-12"),
    await admit("Aisha", "Khan", g5.id, "2015-07-04"),
    await admit("Mateo", "García", g5.id, "2015-01-23"),
    await admit("Zoë", "O'Brien", g5.id, "2015-11-30"),
    await admit("आरव", "शर्मा", g5.id, "2015-05-16"),
    await admit("Yuki", "Tanaka", g5.id, "2015-09-09"),
  ];
  const g6kids = [
    await admit("Amara", "Nwosu", g6.id, "2014-02-14"),
    await admit("Noah", "Fischer", g6.id, "2014-06-01"),
    await admit("Sofia", "Rossi", g6.id, "2014-10-21"),
    await admit("Ethan", "Park", g6.id, "2014-04-08"),
    await admit("Mia", "Santos", g6.id, "2014-12-02"),
  ];
  await admitStudent(admin, { firstName: "Kai", lastName: "Müller" }); // new admission, no class yet
  const [leo, aisha] = g5kids;
  const mia = g6kids[4]!;

  // Logins and guardians: Maria has two children (Leo + Mia), James has one (Aisha).
  await db.update(student).set({ userId: p.student.id }).where(eq(student.id, leo!.id));
  await db.update(student).set({ userId: p.student2.id }).where(eq(student.id, aisha!.id));
  await db.insert(guardian).values([
    { schoolId: sch.id, studentId: leo!.id, userId: p.parent.id },
    { schoolId: sch.id, studentId: mia.id, userId: p.parent.id },
    { schoolId: sch.id, studentId: aisha!.id, userId: p.parent2.id },
  ]);

  // Attendance: 20 school days for both classes, marked by each class's own teacher.
  // Today: Grade 5-A is marked, Grade 6-B is not — the dashboard shows both states.
  const tc1 = (await loadCtx(db, p.teacher, sch.slug))!;
  const tc2 = (await loadCtx(db, p.teacher2, sch.slug))!;
  await attendanceHistory(tc1, g5.id, g5kids, days);
  await attendanceHistory(tc2, g6.id, g6kids, days);
  await attendanceHistory(tc1, g5.id, g5kids, [today]);

  // Exams: full marks for 5-A; 6-B has a student who missed an exam (unscored ≠ zero).
  const exam = (ctx: Ctx, classId: string, name: string, subject: string, maxMarks: number, ago: number) => createExam(ctx, { classId, name, subject, maxMarks, heldOn: shift(today, ago) });
  const g5exams = [
    [await exam(tc1, g5.id, "Unit Test 1", "Maths", 50, 25), [38, 47, 29, 44, 33, 50]],
    [await exam(tc1, g5.id, "Term 1", "Maths", 100, 10), [72, 91, 58, 84, 66, 97]],
    [await exam(tc1, g5.id, "Term 1", "Science", 50, 9), [35, 46, 27, 41, 30, 48]],
    [await exam(tc1, g5.id, "Term 1", "English", 100, 8), [81, 88, 62, 93, 70, 85]],
  ] as const;
  for (const [e, scores] of g5exams) await enterMarks(tc1, { examId: e.id, entries: g5kids.map((s, i) => ({ studentId: s.id, score: scores[i]! })) });
  const g6exams = [
    [await exam(tc2, g6.id, "Term 1", "Maths", 100, 10), [77, 64, 88, null, 59]],
    [await exam(tc2, g6.id, "Term 1", "History", 50, 7), [41, 33, 45, 38, 29]],
  ] as const;
  for (const [e, scores] of g6exams) await enterMarks(tc2, { examId: e.id, entries: g6kids.map((s, i) => ({ studentId: s.id, score: scores[i] ?? null })) });
  await exam(tc2, g6.id, "Term 2", "Geography", 50, -12); // upcoming, no marks yet

  // Fees: paid, partly paid, unpaid, overdue, and one-off invoices.
  await billClass(owner, { classId: g5.id, description: "Term 1 tuition", amount: "450.00", dueOn: shift(today, -14) });
  await billClass(admin, { classId: g6.id, description: "Term 1 tuition", amount: "480.00", dueOn: shift(today, 3) }); // overdue
  const invoiceOf = async (s: Student) => (await listInvoices(owner, { studentId: s.id }))[0]!;
  let k = 0;
  const pay = async (s: Student, amount: string, method: "cash" | "bank" | "card" | "other") =>
    recordPayment(owner, { invoiceId: (await invoiceOf(s)).id, amount, method, idempotencyKey: `seed-${++k}` });
  await pay(leo!, "200", "bank"); // partly paid
  await pay(aisha!, "450", "card"); // paid
  await pay(g5kids[2]!, "450", "bank"); // paid
  await pay(g6kids[0]!, "480", "cash"); // paid
  await pay(mia, "100", "cash"); // partly paid and overdue
  await createInvoice(admin, { studentId: g5kids[3]!.id, description: "Science museum trip", amount: "35.00", dueOn: shift(today, -7) });
  const lab = await createInvoice(owner, { studentId: g5kids[5]!.id, description: "Lab materials", amount: "20.00", dueOn: shift(today, 5) });
  await recordPayment(owner, { invoiceId: lab.id, amount: "20", method: "cash", idempotencyKey: "seed-lab" });

  // Documents on two students (the download links are signed and expire after 5 minutes).
  await uploadDocument(owner, { studentId: leo!.id, filename: "Leo Santos - birth certificate.pdf", bytes: PDF });
  await uploadDocument(admin, { studentId: leo!.id, filename: "Leo Santos - photo.png", bytes: PNG });
  await uploadDocument(owner, { studentId: aisha!.id, filename: "Aisha Khan - transfer certificate.pdf", bytes: PDF });

  // Pending invites (Members page). Their links are only viewable when MAIL_SINK=1.
  await inviteMember(owner, { email: "new.teacher@example.com", role: "teacher" });
  await inviteMember(admin, { email: "sofia.parent@example.com", role: "parent", studentId: g6kids[2]!.id });

  return { principal: p.principal, students: g5kids.length + g6kids.length + 1 };
}

/** A second school: proves multi-school switching and that schools never see each other's data. */
async function riverside(db: DB, principal: Person) {
  const TZ = "Europe/London";
  const today = todayIn(TZ);
  const head = await makeUser(db, "Tom Becker", "riverside@example.com");
  const sch = await createSchool(db, head, { name: "Riverside Academy", currency: "EUR", timezone: TZ });
  const owner = (await loadCtx(db, head, sch.slug))!;
  await join(db, owner, principal, "admin"); // Priya works at both schools → school picker shows two
  const y9 = await createClass(owner, { name: "Year 9" });
  const kids = [
    await admitStudent(owner, { firstName: "Freya", lastName: "Hughes", classId: y9.id }),
    await admitStudent(owner, { firstName: "Oliver", lastName: "Byrne", classId: y9.id }),
    await admitStudent(owner, { firstName: "Chloé", lastName: "Martin", classId: y9.id }),
  ];
  await attendanceHistory(owner, y9.id, kids, schoolDays(today, 5));
  await billClass(owner, { classId: y9.id, description: "Autumn term", amount: "300.00", dueOn: shift(today, -21) });
  const inv = (await listInvoices(owner, { studentId: kids[0]!.id }))[0]!;
  await recordPayment(owner, { invoiceId: inv.id, amount: "300", method: "bank", idempotencyKey: "seed-riverside-1" });
  return kids.length;
}

async function main() {
  const dir = process.env.PGLITE_DIR || ".data/pglite";
  if (process.argv.includes("--reset")) {
    if (process.env.DATABASE_URL) throw new Error("--reset only wipes the local PGlite folder; refusing with DATABASE_URL set.");
    for (const d of [dir, process.env.UPLOAD_DIR || ".data/uploads"]) rmSync(d, { recursive: true, force: true });
  }
  const db = await connect({ url: process.env.DATABASE_URL || undefined, dir });
  if ((await db.select().from(school).where(eq(school.slug, "maple-grove-school"))).length) {
    console.log("Demo data is ready (already seeded). `pnpm seed:reset` starts over.");
    return;
  }
  const maple = await mapleGrove(db);
  const rivers = await riverside(db, maple.principal);
  console.log(`Seeded 2 schools: Maple Grove (10 users, 3 classes, ${maple.students} students) and Riverside (1 more user, ${rivers} students).`);
  console.log("Accounts and what to try with each: README.md → Demo data. Password: DEMO_PASSWORD from .env.example.");
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
