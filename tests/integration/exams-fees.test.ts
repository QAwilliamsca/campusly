import { beforeAll, describe, expect, it } from "vitest";
import type { DB } from "@/db/connect";
import { guardian } from "@/db/schema";
import { assignTeacher, createClass } from "@/lib/services/classes";
import { admitStudent } from "@/lib/services/students";
import { createExam, enterMarks, reportCard } from "@/lib/services/exams";
import { billClass, createInvoice, listInvoices, recordPayment } from "@/lib/services/fees";
import { addMember, expectCode, makeSchool, testDb } from "./helpers";

let db: DB;
beforeAll(async () => {
  db = await testDb();
});

async function setup(currency = "USD") {
  const ctx = await makeSchool(db, { currency });
  const t = await addMember(db, ctx, "teacher");
  const c = await createClass(ctx, { name: "6-B" });
  await assignTeacher(ctx, { classId: c.id, teacherMembershipId: t.member.id });
  const a = await admitStudent(ctx, { firstName: "Ana", lastName: "Lima", classId: c.id });
  const b = await admitStudent(ctx, { firstName: "Ben", lastName: "Ode", classId: c.id });
  return { ctx, t, c, a, b };
}

describe("S-05 exams & report cards", () => {
  it("rejects out-of-range scores; report card sums correctly", async () => {
    const { t, c, a } = await setup();
    const math = await createExam(t, { classId: c.id, name: "Term 1", subject: "Maths", maxMarks: 100, heldOn: "2026-10-01" });
    const sci = await createExam(t, { classId: c.id, name: "Term 1", subject: "Science", maxMarks: 50, heldOn: "2026-10-02" });
    await expectCode(enterMarks(t, { examId: math.id, entries: [{ studentId: a.id, score: 105 }] }), "invalid");
    await expectCode(enterMarks(t, { examId: math.id, entries: [{ studentId: a.id, score: -1 }] }), "invalid");
    await enterMarks(t, { examId: math.id, entries: [{ studentId: a.id, score: 80 }] });
    await enterMarks(t, { examId: math.id, entries: [{ studentId: a.id, score: 90 }] }); // re-entry updates
    await enterMarks(t, { examId: sci.id, entries: [{ studentId: a.id, score: 30 }] });
    const rc = await reportCard(t, a.id);
    expect(rc.rows.map((r) => [r.subject, r.score, r.percent])).toEqual([["Maths", 90, 90], ["Science", 30, 60]]);
    expect(rc.overall).toBe(80); // (90+30)/(100+50)
  });

  it("empty report card has no NaN/Infinity", async () => {
    const { t, b } = await setup();
    const rc = await reportCard(t, b.id);
    expect(rc.rows).toEqual([]);
    expect(rc.overall).toBeNull();
  });

  it("unscored students are skipped, not zeroed", async () => {
    const { t, c, a, b } = await setup();
    const e = await createExam(t, { classId: c.id, name: "Quiz", subject: "Art", maxMarks: 10, heldOn: "2026-10-03" });
    await enterMarks(t, { examId: e.id, entries: [{ studentId: a.id, score: 7 }, { studentId: b.id, score: null }] });
    expect((await reportCard(t, b.id)).rows).toEqual([]);
  });

  it("parents see only their child's card; students only their own", async () => {
    const { ctx, a, b } = await setup();
    const p = await addMember(db, ctx, "parent");
    await db.insert(guardian).values({ schoolId: ctx.school.id, studentId: a.id, userId: p.user.id });
    await reportCard(p, a.id);
    await expectCode(reportCard(p, b.id), "not_found");
    const s = await addMember(db, ctx, "student");
    await db.execute(`update student set user_id = '${s.user.id}' where id = '${b.id}'`);
    await reportCard(s, b.id);
    await expectCode(reportCard(s, a.id), "not_found");
  });
});

describe("S-06 fees", () => {
  it("stores minor units; status derives from payments; overpayment refused", async () => {
    const { ctx, a } = await setup();
    const inv = await createInvoice(ctx, { studentId: a.id, description: "Term fee", amount: "150.00", dueOn: "2026-11-01" });
    expect(inv.amountMinor).toBe(15000);
    expect(inv.code).toBe("INV-0001");
    await recordPayment(ctx, { invoiceId: inv.id, amount: "100", method: "cash", idempotencyKey: "k1" });
    let [row] = await listInvoices(ctx, { studentId: a.id });
    expect(row).toMatchObject({ paidMinor: 10000, status: "partial" });
    await expectCode(recordPayment(ctx, { invoiceId: inv.id, amount: "50.01", method: "cash", idempotencyKey: "k2" }), "invalid");
    await recordPayment(ctx, { invoiceId: inv.id, amount: "50", method: "bank", idempotencyKey: "k3" });
    [row] = await listInvoices(ctx, { studentId: a.id });
    expect(row).toMatchObject({ paidMinor: 15000, status: "paid" });
  });

  it("double-click: the same idempotency key records exactly one payment", async () => {
    const { ctx, a } = await setup();
    const inv = await createInvoice(ctx, { studentId: a.id, description: "Bus", amount: "20", dueOn: "2026-11-01" });
    await Promise.all([1, 2, 3].map(() => recordPayment(ctx, { invoiceId: inv.id, amount: "5", method: "cash", idempotencyKey: "same" })));
    const [row] = await listInvoices(ctx, { studentId: a.id });
    expect(row!.paidMinor).toBe(500);
  });

  it("concurrent different payments cannot together overpay", async () => {
    const { ctx, a } = await setup();
    const inv = await createInvoice(ctx, { studentId: a.id, description: "Lab", amount: "10", dueOn: "2026-11-01" });
    const results = await Promise.allSettled(["x", "y", "z"].map((k) => recordPayment(ctx, { invoiceId: inv.id, amount: "6", method: "cash", idempotencyKey: k })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const [row] = await listInvoices(ctx, { studentId: a.id });
    expect(row!.paidMinor).toBe(600);
  });

  it("zero-decimal currencies and bulk billing a class", async () => {
    const { ctx, c } = await setup("JPY");
    const count = await billClass(ctx, { classId: c.id, description: "Trip", amount: "3000", dueOn: "2026-12-01" });
    expect(count).toBe(2);
    const rows = await listInvoices(ctx);
    expect(rows.map((r) => r.amountMinor)).toEqual([3000, 3000]);
    await expectCode(billClass(ctx, { classId: c.id, description: "Bad", amount: "1.5", dueOn: "2026-12-01" }), "invalid");
  });

  it("parents see their child's invoices; teachers see none", async () => {
    const { ctx, t, a, b } = await setup();
    await createInvoice(ctx, { studentId: a.id, description: "A", amount: "1", dueOn: "2026-11-01" });
    await createInvoice(ctx, { studentId: b.id, description: "B", amount: "1", dueOn: "2026-11-01" });
    const p = await addMember(db, ctx, "parent");
    await db.insert(guardian).values({ schoolId: ctx.school.id, studentId: a.id, userId: p.user.id });
    expect((await listInvoices(p)).map((r) => r.description)).toEqual(["A"]);
    await expectCode(listInvoices(t), "forbidden");
  });
});
