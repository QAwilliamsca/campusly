import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { ATTENDANCE, attendance, schoolClass, student } from "@/db/schema";
import { audit } from "@/db/audit";
import type { Ctx } from "../context";
import { AppError, assertCan, notFound, parse } from "../errors";
import { todayIn } from "../time";
import { id, isoDate } from "../validation";
import { loadStudentFor } from "./students";

const MarkInput = z
  .object({ classId: id, date: isoDate.optional(), entries: z.array(z.object({ studentId: id, status: z.enum(ATTENDANCE) }).strict()).min(1).max(500) })
  .strict();

async function classFor(ctx: Ctx, classId: string) {
  const cls = await ctx.s.findOne(schoolClass, eq(schoolClass.id, parse(id, classId)));
  if (!cls) throw notFound("Class");
  assertCan(ctx.member, "attendance.mark", { classTeacherId: cls.teacherMembershipId });
  return cls;
}

/** S-04: mark a class for one date. Re-saving updates rows (unique per student+date). */
export async function markAttendance(ctx: Ctx, input: unknown) {
  const data = parse(MarkInput, input);
  const cls = await classFor(ctx, data.classId);
  const today = todayIn(ctx.school.timezone);
  const date = data.date ?? today;
  if (date > today) throw new AppError("invalid", "Attendance can't be marked for a future date.");

  const ids = [...new Set(data.entries.map((e) => e.studentId))];
  const inClass = await ctx.s.findMany(student, and(eq(student.classId, cls.id), inArray(student.id, ids)));
  if (inClass.length !== ids.length) throw new AppError("invalid", "Some students are not in this class.");

  await ctx.s
    .insert(
      attendance,
      data.entries.map((e) => ({ studentId: e.studentId, classId: cls.id, onDate: date, status: e.status, markedBy: ctx.user.id })),
    )
    .onConflictDoUpdate({
      target: [attendance.studentId, attendance.onDate],
      set: { status: sql`excluded.status`, markedBy: sql`excluded.marked_by`, classId: sql`excluded.class_id`, updatedAt: sql`now()` } as never,
    })
    .returning();
  const counts = Object.fromEntries(ATTENDANCE.map((s) => [s, data.entries.filter((e) => e.status === s).length]));
  await audit(ctx.s, ctx.user.id, "attendance.mark", "class", cls.id, { after: { date, ...counts } });
  return { date, saved: data.entries.length };
}

export async function classAttendance(ctx: Ctx, input: { classId: string; date: string }) {
  const cls = await classFor(ctx, input.classId);
  return ctx.s.findMany(attendance, and(eq(attendance.classId, cls.id), eq(attendance.onDate, parse(isoDate, input.date))));
}

/** Attendance % = (present + late) / marked days, whole percent; null when nothing is marked. */
export async function attendanceSummary(ctx: Ctx, studentId: string) {
  const st = await loadStudentFor(ctx, studentId, "attendance.view");
  const rows = await ctx.s.findMany(attendance, eq(attendance.studentId, st.id), { orderBy: [sql`${attendance.onDate} desc`] });
  const n = (s: (typeof ATTENDANCE)[number]) => rows.filter((r) => r.status === s).length;
  const present = n("present");
  const late = n("late");
  return {
    present,
    late,
    absent: n("absent"),
    marked: rows.length,
    percent: rows.length ? Math.round(((present + late) / rows.length) * 100) : null,
    recent: rows.slice(0, 10),
  };
}
