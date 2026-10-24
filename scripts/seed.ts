/**
 * Demo preset (PLAYBOOK §11 "Demo data"): one realistic school with fictional people
 * at example.com. Uses the real services, so audit rows exist exactly as in real use.
 * Prints counts only (PLAYBOOK §2.2). Run while the dev server is STOPPED (PGlite is single-process).
 *
 *   pnpm seed            # creates "Maple Grove School" if missing
 */
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { connect, type DB } from "../src/db/connect";
import { account, guardian, school, student, user } from "../src/db/schema";
import { loadCtx } from "../src/lib/context";
import { createSchool } from "../src/lib/services/schools";
import { assignTeacher, createClass } from "../src/lib/services/classes";
import { admitStudent } from "../src/lib/services/students";
import { markAttendance } from "../src/lib/services/attendance";
import { createExam, enterMarks } from "../src/lib/services/exams";
import { billClass, listInvoices, recordPayment } from "../src/lib/services/fees";
import { todayIn } from "../src/lib/time";
import { membership } from "../src/db/schema";

const PASSWORD = process.env.DEMO_PASSWORD || "campusly-demo-1";
const TZ = "America/New_York";

async function makeUser(db: DB, name: string, email: string) {
  const id = crypto.randomUUID();
  await db.insert(user).values({ id, name, email, emailVerified: true });
  await db.insert(account).values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: await hashPassword(PASSWORD) });
  return { id, name, email };
}

const daysAgo = (today: string, n: number) => new Date(Date.parse(today) - n * 86_400_000).toISOString().slice(0, 10);

async function main() {
  const db = await connect({ url: process.env.DATABASE_URL || undefined, dir: process.env.PGLITE_DIR || ".data/pglite" });
  if ((await db.select().from(school).where(eq(school.slug, "maple-grove-school"))).length) {
    console.log("Demo school already exists — nothing to do.");
    return;
  }

  const principal = await makeUser(db, "Priya Natarajan", "principal@example.com");
  const teacherUser = await makeUser(db, "Daniel Okafor", "teacher@example.com");
  const parentUser = await makeUser(db, "Maria Santos", "parent@example.com");
  const studentUser = await makeUser(db, "Leo Santos", "student@example.com");

  const sch = await createSchool(db, principal, { name: "Maple Grove School", currency: "USD", timezone: TZ });
  const ctx = (await loadCtx(db, principal, sch.slug))!;
  const [t] = await db.insert(membership).values({ schoolId: sch.id, userId: teacherUser.id, role: "teacher" }).returning();
  await db.insert(membership).values([
    { schoolId: sch.id, userId: parentUser.id, role: "parent" },
    { schoolId: sch.id, userId: studentUser.id, role: "student" },
  ]);

  const g5 = await createClass(ctx, { name: "Grade 5-A" });
  const g6 = await createClass(ctx, { name: "Grade 6-B" });
  await assignTeacher(ctx, { classId: g5.id, teacherMembershipId: t!.id });

  const names = [
    ["Leo", "Santos"], ["Aisha", "Khan"], ["Mateo", "García"], ["Zoë", "O'Brien"], ["आरव", "शर्मा"],
    ["Yuki", "Tanaka"], ["Amara", "Nwosu"], ["Noah", "Fischer"], ["Sofia", "Rossi"], ["Ethan", "Park"],
  ];
  const kids = [];
  for (const [i, [firstName, lastName]] of names.entries()) {
    kids.push(await admitStudent(ctx, { firstName, lastName, classId: i < 6 ? g5.id : g6.id, dateOfBirth: `2015-0${(i % 9) + 1}-1${i % 9}` }));
  }
  const leo = kids[0]!;
  await db.update(student).set({ userId: studentUser.id }).where(eq(student.id, leo.id));
  await db.insert(guardian).values({ schoolId: sch.id, studentId: leo.id, userId: parentUser.id });

  const tctx = (await loadCtx(db, teacherUser, sch.slug))!;
  const roster = kids.slice(0, 6);
  const today = todayIn(TZ);
  for (let d = 5; d >= 1; d--) {
    const statuses = ["present", "present", "late", "present", "absent", "present"] as const;
    await markAttendance(tctx, { classId: g5.id, date: daysAgo(today, d), entries: roster.map((k, i) => ({ studentId: k.id, status: statuses[(i + d) % 6]! })) });
  }

  const maths = await createExam(tctx, { classId: g5.id, name: "Term 1", subject: "Maths", maxMarks: 100, heldOn: daysAgo(today, 3) });
  const sci = await createExam(tctx, { classId: g5.id, name: "Term 1", subject: "Science", maxMarks: 50, heldOn: daysAgo(today, 2) });
  await enterMarks(tctx, { examId: maths.id, entries: roster.map((k, i) => ({ studentId: k.id, score: 62 + i * 6 })) });
  await enterMarks(tctx, { examId: sci.id, entries: roster.map((k, i) => ({ studentId: k.id, score: 30 + i * 3 })) });

  await billClass(ctx, { classId: g5.id, description: "Term 1 tuition", amount: "450.00", dueOn: daysAgo(today, -14) });
  await billClass(ctx, { classId: g6.id, description: "Term 1 tuition", amount: "480.00", dueOn: daysAgo(today, 2) });
  const leoInv = (await listInvoices(ctx, { studentId: leo.id }))[0]!;
  await recordPayment(ctx, { invoiceId: leoInv.id, amount: "200", method: "bank", idempotencyKey: "seed-leo-1" });
  await recordPayment(ctx, { invoiceId: (await listInvoices(ctx, { studentId: kids[1]!.id }))[0]!.id, amount: "450", method: "card", idempotencyKey: "seed-aisha-1" });

  console.log(`Seeded "Maple Grove School": 4 users, 2 classes, ${kids.length} students, 30 attendance rows, 2 exams, ${kids.length} invoices.`);
  console.log(`Sign in with principal@ / teacher@ / parent@ / student@example.com — password from DEMO_PASSWORD (.env.example).`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
