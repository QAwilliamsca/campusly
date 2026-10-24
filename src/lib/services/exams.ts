import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { exam, mark, schoolClass, student } from "@/db/schema";
import { audit } from "@/db/audit";
import type { Ctx } from "../context";
import { isStaff } from "../can";
import { AppError, assertCan, notFound, parse } from "../errors";
import { id, isoDate, text } from "../validation";
import { loadStudentFor } from "./students";

const ExamInput = z
  .object({ classId: id, name: text(80), subject: text(80), maxMarks: z.coerce.number().int().min(1).max(1000), heldOn: isoDate })
  .strict();
const MarksInput = z
  .object({ examId: id, entries: z.array(z.object({ studentId: id, score: z.number().int().nullable() }).strict()).min(1).max(500) })
  .strict();

async function classFor(ctx: Ctx, classId: string) {
  const cls = await ctx.s.findOne(schoolClass, eq(schoolClass.id, classId));
  if (!cls) throw notFound("Class");
  assertCan(ctx.member, "exam.manage", { classTeacherId: cls.teacherMembershipId });
  return cls;
}

export async function createExam(ctx: Ctx, input: unknown) {
  const data = parse(ExamInput, input);
  await classFor(ctx, data.classId);
  const [row] = await ctx.s.insert(exam, data).returning();
  await audit(ctx.s, ctx.user.id, "exam.create", "exam", row!.id, { after: data });
  return row!;
}

export async function listExams(ctx: Ctx) {
  const order = { orderBy: [exam.heldOn, exam.subject] };
  if (isStaff(ctx.member)) return ctx.s.findMany(exam, undefined, order);
  if (ctx.member.role !== "teacher") return [];
  const classes = await ctx.s.findMany(schoolClass, eq(schoolClass.teacherMembershipId, ctx.member.id));
  return classes.length ? ctx.s.findMany(exam, inArray(exam.classId, classes.map((c) => c.id)), order) : [];
}

/** Exam + its class's students + their marks — the marks-entry screen. */
export async function getExam(ctx: Ctx, examId: string) {
  const ex = await ctx.s.findOne(exam, eq(exam.id, parse(id, examId)));
  if (!ex) throw notFound("Exam");
  const cls = await classFor(ctx, ex.classId).catch(() => {
    throw notFound("Exam");
  });
  const students = await ctx.s.findMany(student, eq(student.classId, cls.id), { orderBy: [student.code] });
  const marks = await ctx.s.findMany(mark, eq(mark.examId, ex.id));
  return { exam: ex, className: cls.name, students, scores: new Map(marks.map((m) => [m.studentId, m.score])) };
}

/** S-05: enter marks. Score must be 0..max; null clears a mark. */
export async function enterMarks(ctx: Ctx, input: unknown) {
  const data = parse(MarksInput, input);
  const ex = await ctx.s.findOne(exam, eq(exam.id, data.examId));
  if (!ex) throw notFound("Exam");
  const cls = await classFor(ctx, ex.classId);
  for (const e of data.entries) {
    if (e.score !== null && (e.score < 0 || e.score > ex.maxMarks)) throw new AppError("invalid", `Scores must be between 0 and ${ex.maxMarks}.`);
  }
  const ids = [...new Set(data.entries.map((e) => e.studentId))];
  const inClass = await ctx.s.findMany(student, and(eq(student.classId, cls.id), inArray(student.id, ids)));
  if (inClass.length !== ids.length) throw new AppError("invalid", "Some students are not in this class.");

  await ctx.s.transaction(async (s) => {
    for (const e of data.entries) {
      if (e.score === null) await s.delete(mark, and(eq(mark.examId, ex.id), eq(mark.studentId, e.studentId))!);
      else await s.insert(mark, { examId: ex.id, studentId: e.studentId, score: e.score }).onConflictDoUpdate({ target: [mark.examId, mark.studentId], set: { score: e.score } }).returning();
    }
    await audit(s, ctx.user.id, "marks.enter", "exam", ex.id, { after: { entries: data.entries.length } });
  });
}

const pct = (score: number, max: number) => (max > 0 ? Math.round((score / max) * 100) : null);

/** Report card: one row per scored exam; overall = sum(scores) / sum(max). Never NaN. */
export async function reportCard(ctx: Ctx, studentId: string) {
  const st = await loadStudentFor(ctx, studentId, "reportcard.view");
  const marks = await ctx.s.findMany(mark, eq(mark.studentId, st.id));
  const exams = marks.length ? await ctx.s.findMany(exam, inArray(exam.id, marks.map((m) => m.examId)), { orderBy: [exam.heldOn, exam.subject] }) : [];
  const score = new Map(marks.map((m) => [m.examId, m.score]));
  const rows = exams.map((e) => ({ examName: e.name, subject: e.subject, heldOn: e.heldOn, score: score.get(e.id)!, max: e.maxMarks, percent: pct(score.get(e.id)!, e.maxMarks) }));
  const total = rows.reduce((a, r) => ({ score: a.score + r.score, max: a.max + r.max }), { score: 0, max: 0 });
  return { student: st, rows, overall: rows.length ? pct(total.score, total.max) : null };
}
