import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { invoice, payment, schoolClass, student } from "@/db/schema";
import { audit } from "@/db/audit";
import { nextCode } from "@/db/codes";
import type { Ctx } from "../context";
import { hasAnyGrant, isStaff } from "../can";
import { AppError, assertCan, isUniqueViolation, notFound, parse } from "../errors";
import { toMinor } from "../money";
import { todayIn } from "../time";
import { amount, id, isoDate, text } from "../validation";
import { visibleStudents } from "./students";

const InvoiceInput = z.object({ studentId: id, description: text(120), amount, dueOn: isoDate }).strict();
const BillInput = z.object({ classId: id, description: text(120), amount, dueOn: isoDate }).strict();
const PaymentInput = z
  .object({ invoiceId: id, amount, method: z.enum(["cash", "bank", "card", "other"]), paidOn: isoDate.optional(), idempotencyKey: z.string().min(1).max(100) })
  .strict();

function minor(ctx: Ctx, value: string) {
  let m: number;
  try {
    m = toMinor(value, ctx.school.currency);
  } catch (e) {
    throw new AppError("invalid", `amount: ${(e as Error).message}`);
  }
  if (m <= 0) throw new AppError("invalid", "amount: Must be more than zero");
  return m;
}

export async function createInvoice(ctx: Ctx, input: unknown) {
  assertCan(ctx.member, "fee.manage");
  const data = parse(InvoiceInput, input);
  const amountMinor = minor(ctx, data.amount);
  if (!(await ctx.s.findOne(student, eq(student.id, data.studentId)))) throw notFound("Student");
  return ctx.s.transaction(async (s) => {
    const code = await nextCode(s, "invoice", "INV");
    const [row] = await s.insert(invoice, { studentId: data.studentId, description: data.description, amountMinor, currency: ctx.school.currency, dueOn: data.dueOn, code }).returning();
    await audit(s, ctx.user.id, "invoice.create", "invoice", row!.id, { after: { code, amountMinor } });
    return row!;
  });
}

/** Bill every student in a class at once (the phase-1 "fee structure"). All-or-nothing. */
export async function billClass(ctx: Ctx, input: unknown) {
  assertCan(ctx.member, "fee.manage");
  const data = parse(BillInput, input);
  const amountMinor = minor(ctx, data.amount);
  const cls = await ctx.s.findOne(schoolClass, eq(schoolClass.id, data.classId));
  if (!cls) throw notFound("Class");
  const students = await ctx.s.findMany(student, eq(student.classId, cls.id), { orderBy: [student.code] });
  if (!students.length) throw new AppError("invalid", "This class has no students yet.");
  await ctx.s.transaction(async (s) => {
    for (const st of students) {
      const code = await nextCode(s, "invoice", "INV");
      await s.insert(invoice, { studentId: st.id, description: data.description, amountMinor, currency: ctx.school.currency, dueOn: data.dueOn, code }).returning();
    }
    await audit(s, ctx.user.id, "invoice.bill_class", "class", cls.id, { after: { count: students.length, amountMinor } });
  });
  return students.length;
}

/**
 * S-06: record a payment. The invoice row is locked for the transaction, so
 * parallel payments can't overpay; the idempotency key makes a double click a no-op.
 */
export async function recordPayment(ctx: Ctx, input: unknown) {
  assertCan(ctx.member, "fee.manage");
  const data = parse(PaymentInput, input);
  const amountMinor = minor(ctx, data.amount);
  try {
    return await ctx.s.transaction(async (s) => {
      const inv = await s.lockOne(invoice, eq(invoice.id, data.invoiceId));
      if (!inv) throw notFound("Invoice");
      const dup = await s.findOne(payment, eq(payment.idempotencyKey, data.idempotencyKey));
      if (dup) return dup;
      const paid = (await s.findMany(payment, eq(payment.invoiceId, inv.id))).reduce((a, p) => a + p.amountMinor, 0);
      if (paid + amountMinor > inv.amountMinor) throw new AppError("invalid", "That is more than the balance due.");
      const [row] = await s
        .insert(payment, { invoiceId: inv.id, amountMinor, method: data.method, paidOn: data.paidOn ?? todayIn(ctx.school.timezone), idempotencyKey: data.idempotencyKey, recordedBy: ctx.user.id })
        .returning();
      await audit(s, ctx.user.id, "payment.record", "invoice", inv.id, { after: { amountMinor, method: data.method } });
      return row!;
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw new AppError("conflict", "This payment was already recorded.");
    throw e;
  }
}

export type InvoiceRow = typeof invoice.$inferSelect & {
  paidMinor: number;
  status: "unpaid" | "partial" | "paid";
  overdue: boolean;
  studentName: string;
  studentCode: string;
};

/** Staff: all invoices; parents/students: their own; teachers: refused. */
export async function listInvoices(ctx: Ctx, filter: { studentId?: string } = {}): Promise<InvoiceRow[]> {
  if (!hasAnyGrant(ctx.member, "fee.view")) throw new AppError("forbidden", "You don't have permission to do that.");
  const students = await visibleStudents(ctx);
  const byId = new Map(students.map((s) => [s.id, s]));
  let ids = isStaff(ctx.member) ? null : students.map((s) => s.id);
  if (filter.studentId) ids = (ids ?? [filter.studentId]).filter((x) => x === filter.studentId);
  if (ids && !ids.length) return [];
  const invoices = await ctx.s.findMany(invoice, ids ? inArray(invoice.studentId, ids) : undefined, { orderBy: [invoice.code] });
  const payments = invoices.length ? await ctx.s.findMany(payment, inArray(payment.invoiceId, invoices.map((i) => i.id))) : [];
  const today = todayIn(ctx.school.timezone);
  return invoices.map((inv) => {
    const paidMinor = payments.filter((p) => p.invoiceId === inv.id).reduce((a, p) => a + p.amountMinor, 0);
    const status = paidMinor >= inv.amountMinor ? "paid" : paidMinor > 0 ? "partial" : "unpaid";
    const st = byId.get(inv.studentId);
    return { ...inv, paidMinor, status, overdue: status !== "paid" && inv.dueOn < today, studentName: st ? `${st.firstName} ${st.lastName}` : "—", studentCode: st?.code ?? "—" };
  });
}

