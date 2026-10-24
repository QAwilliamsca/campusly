import { eq } from "drizzle-orm";
import { z } from "zod";
import { membership, schoolClass } from "@/db/schema";
import { audit } from "@/db/audit";
import type { Ctx } from "../context";
import { isStaff } from "../can";
import { AppError, assertCan, isUniqueViolation, notFound, parse } from "../errors";
import { id, text } from "../validation";

const ClassInput = z.object({ name: text(60) }).strict();
const AssignInput = z.object({ classId: id, teacherMembershipId: id.nullable() }).strict();

export async function createClass(ctx: Ctx, input: unknown) {
  assertCan(ctx.member, "class.manage");
  const data = parse(ClassInput, input);
  try {
    const [row] = await ctx.s.insert(schoolClass, data).returning();
    await audit(ctx.s, ctx.user.id, "class.create", "class", row!.id, { after: data });
    return row!;
  } catch (e) {
    if (isUniqueViolation(e)) throw new AppError("conflict", `A class named "${data.name}" already exists.`);
    throw e;
  }
}

export async function assignTeacher(ctx: Ctx, input: unknown) {
  assertCan(ctx.member, "class.manage");
  const data = parse(AssignInput, input);
  const cls = await ctx.s.findOne(schoolClass, eq(schoolClass.id, data.classId));
  if (!cls) throw notFound("Class");
  if (data.teacherMembershipId) {
    const t = await ctx.s.findOne(membership, eq(membership.id, data.teacherMembershipId));
    if (t?.role !== "teacher") throw new AppError("invalid", "Choose a teacher.");
  }
  const [row] = await ctx.s.update(schoolClass, { teacherMembershipId: data.teacherMembershipId }, eq(schoolClass.id, cls.id));
  await audit(ctx.s, ctx.user.id, "class.assign", "class", cls.id, { before: { teacher: cls.teacherMembershipId }, after: { teacher: data.teacherMembershipId } });
  return row!;
}

/** Staff see every class; teachers see the classes they teach; others none. */
export async function listClasses(ctx: Ctx) {
  const order = { orderBy: [schoolClass.name] };
  if (isStaff(ctx.member)) return ctx.s.findMany(schoolClass, undefined, order);
  if (ctx.member.role === "teacher") return ctx.s.findMany(schoolClass, eq(schoolClass.teacherMembershipId, ctx.member.id), order);
  return [];
}
