import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { guardian, schoolClass, student } from "@/db/schema";
import { audit } from "@/db/audit";
import { nextCode } from "@/db/codes";
import { planOf } from "@/db/global";
import type { Ctx } from "../context";
import { can, isStaff, type Action, type Resource } from "../can";
import { AppError, assertCan, notFound, parse } from "../errors";
import { id, isoDate, text } from "../validation";

export type Student = typeof student.$inferSelect;

const Fields = { firstName: text(100), lastName: text(100), dateOfBirth: isoDate.nullish(), classId: id.nullish() };
const AdmitInput = z.object(Fields).strict();
const UpdateInput = z.object({ ...Fields, id, version: z.coerce.number().int().positive() }).strict();

async function checkClass(ctx: Ctx, classId?: string | null) {
  if (classId && !(await ctx.s.findOne(schoolClass, eq(schoolClass.id, classId)))) throw notFound("Class");
}

/** S-03: admit a student with the next code, inside the plan's student limit. */
export async function admitStudent(ctx: Ctx, input: unknown) {
  assertCan(ctx.member, "student.manage");
  const data = parse(AdmitInput, input);
  await checkClass(ctx, data.classId);
  return ctx.s.transaction(async (s) => {
    // nextCode row-locks this school's counter until commit, so the limit check below
    // can't be raced by a parallel admission. A rollback also gives the number back.
    const code = await nextCode(s, "student", "STU");
    const plan = await planOf(s);
    if ((await s.count(student)) >= plan.limitValue) {
      throw new AppError("limit", `Your ${plan.name} plan allows ${plan.limitValue} students. Upgrade to admit more.`);
    }
    const [row] = await s.insert(student, { ...data, dateOfBirth: data.dateOfBirth ?? null, classId: data.classId ?? null, code }).returning();
    await audit(s, ctx.user.id, "student.admit", "student", row!.id, { after: { code, classId: row!.classId } });
    return row!;
  });
}

/** Edit with optimistic locking: a stale `version` means someone else saved first. */
export async function updateStudent(ctx: Ctx, input: unknown) {
  assertCan(ctx.member, "student.manage");
  const data = parse(UpdateInput, input);
  await checkClass(ctx, data.classId);
  const before = await ctx.s.findOne(student, eq(student.id, data.id));
  if (!before) throw notFound("Student");
  const { id: sid, version, ...fields } = data;
  const [row] = await ctx.s.update(
    student,
    { ...fields, dateOfBirth: fields.dateOfBirth ?? null, classId: fields.classId ?? null, version: version + 1 },
    and(eq(student.id, sid), eq(student.version, version))!,
  );
  if (!row) throw new AppError("conflict", "Someone else changed this student. Reload to see their changes.");
  await audit(ctx.s, ctx.user.id, "student.update", "student", sid, {
    before: { firstName: before.firstName, lastName: before.lastName, classId: before.classId },
    after: { firstName: row.firstName, lastName: row.lastName, classId: row.classId },
  });
  return row;
}

/** Students this member may see (visibility filter, PLAYBOOK §10). */
export async function visibleStudents(ctx: Ctx): Promise<Student[]> {
  const order = { orderBy: [student.code] };
  if (isStaff(ctx.member)) return ctx.s.findMany(student, undefined, order);
  if (ctx.member.role === "teacher") {
    const classes = await ctx.s.findMany(schoolClass, eq(schoolClass.teacherMembershipId, ctx.member.id));
    return classes.length ? ctx.s.findMany(student, inArray(student.classId, classes.map((c) => c.id)), order) : [];
  }
  if (ctx.member.role === "parent") {
    const links = await ctx.s.findMany(guardian, eq(guardian.userId, ctx.user.id));
    return links.length ? ctx.s.findMany(student, inArray(student.id, links.map((l) => l.studentId)), order) : [];
  }
  return ctx.s.findMany(student, eq(student.userId, ctx.user.id), order);
}

export const listStudents = visibleStudents;

async function resourceOf(ctx: Ctx, st: Student): Promise<Resource> {
  const cls = st.classId ? await ctx.s.findOne(schoolClass, eq(schoolClass.id, st.classId)) : null;
  const links = await ctx.s.findMany(guardian, eq(guardian.studentId, st.id));
  return { classTeacherId: cls?.teacherMembershipId ?? null, guardianUserIds: links.map((l) => l.userId), studentUserId: st.userId };
}

/**
 * Load one student for an action. Anyone who may not see it gets "not found" —
 * the same answer as a wrong ID — so existence never leaks (no IDOR).
 */
export async function loadStudentFor(ctx: Ctx, studentId: string, action: Action) {
  const st = await ctx.s.findOne(student, eq(student.id, parse(id, studentId)));
  if (!st || !can(ctx.member, action, await resourceOf(ctx, st))) throw notFound("Student");
  return st;
}

export async function getStudent(ctx: Ctx, studentId: string) {
  const st = await loadStudentFor(ctx, studentId, "student.view");
  const cls = st.classId ? await ctx.s.findOne(schoolClass, eq(schoolClass.id, st.classId)) : null;
  return { ...st, className: cls?.name ?? null };
}
