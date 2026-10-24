import { eq } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/db/connect";
import { membership, school } from "@/db/schema";
import { scoped } from "@/db/scoped";
import { audit } from "@/db/audit";
import type { Ctx, SessionUser } from "../context";
import { AppError, assertCan, isUniqueViolation, parse } from "../errors";
import { currency, text, timezone } from "../validation";

const SchoolInput = z.object({ name: text(120), currency, timezone }).strict();

const slugify = (name: string) =>
  name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "school";

/** S-01: create a school; the creator becomes its owner. */
export async function createSchool(db: DB, user: SessionUser, input: unknown) {
  const data = parse(SchoolInput, input);
  const base = slugify(data.name);
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt ? `${base}-${crypto.randomUUID().slice(0, 4)}` : base;
    try {
      return await db.transaction(async (tx) => {
        const [row] = await tx.insert(school).values({ ...data, slug, planId: "trial" }).returning();
        await tx.insert(membership).values({ schoolId: row!.id, userId: user.id, role: "owner" });
        await audit(scoped(tx, row!.id), user.id, "school.create", "school", row!.id, { after: data });
        return row!;
      });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e; // slug taken → retry with a suffix
    }
  }
  throw new AppError("conflict", "Could not pick a unique address for this school. Try a different name.");
}

export async function listMySchools(db: DB, userId: string) {
  return db
    .select({ id: school.id, name: school.name, slug: school.slug, role: membership.role })
    .from(membership)
    .innerJoin(school, eq(school.id, membership.schoolId))
    .where(eq(membership.userId, userId))
    .orderBy(school.name);
}

export async function updateSettings(ctx: Ctx, input: unknown) {
  assertCan(ctx.member, "school.settings");
  const data = parse(SchoolInput, input);
  const [row] = await ctx.s._conn.update(school).set(data).where(eq(school.id, ctx.school.id)).returning();
  await audit(ctx.s, ctx.user.id, "school.update", "school", ctx.school.id, {
    before: { name: ctx.school.name, currency: ctx.school.currency, timezone: ctx.school.timezone },
    after: data,
  });
  return row!;
}
