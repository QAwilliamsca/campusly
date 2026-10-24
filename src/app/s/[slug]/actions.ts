"use server";

import { revalidatePath } from "next/cache";
import { requireCtx } from "@/lib/session";
import { run } from "@/lib/run";
import type { Result } from "@/lib/result";
import { updateSettings } from "@/lib/services/schools";
import { inviteMember, removeMember, revokeInvite } from "@/lib/services/members";
import { assignTeacher, createClass } from "@/lib/services/classes";
import { admitStudent, updateStudent } from "@/lib/services/students";
import { uploadDocument } from "@/lib/services/documents";
import { markAttendance } from "@/lib/services/attendance";
import { createExam, enterMarks } from "@/lib/services/exams";
import { billClass, createInvoice, recordPayment } from "@/lib/services/fees";
import { AppError } from "@/lib/errors";

// Thin wrappers: read named fields only (never spread FormData), call the service, refresh the page.

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
};

/** Collect `prefix:<id>` fields, e.g. status:<studentId> → [{ id, value }]. */
const keyed = (fd: FormData, prefix: string) =>
  [...fd.entries()].filter(([k]) => k.startsWith(prefix)).map(([k, v]) => ({ id: k.slice(prefix.length), value: String(v) }));

async function act(fd: FormData, fn: (ctx: Awaited<ReturnType<typeof requireCtx>>) => Promise<string | void>): Promise<Result> {
  const slug = String(fd.get("slug") ?? "");
  const ctx = await requireCtx(slug);
  const res = await run(() => fn(ctx));
  if (res?.ok) revalidatePath(`/s/${slug}`, "layout");
  return res;
}

export const updateSettingsAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    await updateSettings(ctx, { name: str(fd, "name"), currency: str(fd, "currency"), timezone: str(fd, "timezone") });
    return "Settings saved.";
  });

export const inviteAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    const { link } = await inviteMember(ctx, { email: str(fd, "email"), role: str(fd, "role"), studentId: str(fd, "studentId") });
    return `Invite created. Email is in dry-run mode, so share this link: ${link}`;
  });

export const revokeInviteAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    await revokeInvite(ctx, String(fd.get("inviteId")));
    return "Invite revoked.";
  });

export const removeMemberAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    await removeMember(ctx, String(fd.get("membershipId")));
    return "Member removed.";
  });

export const createClassAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    const c = await createClass(ctx, { name: str(fd, "name") });
    return `Class "${c.name}" created.`;
  });

export const assignTeacherAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    await assignTeacher(ctx, { classId: str(fd, "classId"), teacherMembershipId: str(fd, "teacherMembershipId") ?? null });
    return "Teacher updated.";
  });

export const admitStudentAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    const s = await admitStudent(ctx, { firstName: str(fd, "firstName"), lastName: str(fd, "lastName"), dateOfBirth: str(fd, "dateOfBirth"), classId: str(fd, "classId") });
    return `${s.firstName} ${s.lastName} admitted as ${s.code}.`;
  });

export const updateStudentAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    await updateStudent(ctx, {
      id: str(fd, "id"),
      version: str(fd, "version"),
      firstName: str(fd, "firstName"),
      lastName: str(fd, "lastName"),
      dateOfBirth: str(fd, "dateOfBirth"),
      classId: str(fd, "classId"),
    });
    return "Student saved.";
  });

export const uploadDocumentAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) throw new AppError("invalid", "Choose a file to upload.");
    await uploadDocument(ctx, { studentId: String(fd.get("studentId")), filename: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
    return "Document uploaded.";
  });

export const markAttendanceAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    const entries = keyed(fd, "status:").map((e) => ({ studentId: e.id, status: e.value }));
    if (!entries.length) throw new AppError("invalid", "There are no students to mark.");
    const r = await markAttendance(ctx, { classId: str(fd, "classId"), date: str(fd, "date"), entries });
    return `Saved attendance for ${r.saved} student(s) on ${r.date}.`;
  });

export const createExamAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    await createExam(ctx, { classId: str(fd, "classId"), name: str(fd, "name"), subject: str(fd, "subject"), maxMarks: str(fd, "maxMarks"), heldOn: str(fd, "heldOn") });
    return "Exam created.";
  });

export const enterMarksAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    const entries = keyed(fd, "score:").map((e) => {
      if (e.value.trim() === "") return { studentId: e.id, score: null };
      const score = Number(e.value);
      if (!Number.isInteger(score)) throw new AppError("invalid", "Scores must be whole numbers.");
      return { studentId: e.id, score };
    });
    await enterMarks(ctx, { examId: str(fd, "examId"), entries });
    return "Marks saved.";
  });

export const createInvoiceAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    const i = await createInvoice(ctx, { studentId: str(fd, "studentId"), description: str(fd, "description"), amount: str(fd, "amount"), dueOn: str(fd, "dueOn") });
    return `Invoice ${i.code} created.`;
  });

export const billClassAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    const n = await billClass(ctx, { classId: str(fd, "classId"), description: str(fd, "description"), amount: str(fd, "amount"), dueOn: str(fd, "dueOn") });
    return `Created ${n} invoice(s).`;
  });

export const recordPaymentAction = async (_: Result, fd: FormData) =>
  act(fd, async (ctx) => {
    await recordPayment(ctx, { invoiceId: str(fd, "invoiceId"), amount: str(fd, "amount"), method: str(fd, "method"), idempotencyKey: str(fd, "idempotencyKey") });
    return "Payment recorded.";
  });
