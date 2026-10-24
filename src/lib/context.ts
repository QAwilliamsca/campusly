import { and, eq } from "drizzle-orm";
import type { DB } from "@/db/connect";
import { membership, school } from "@/db/schema";
import { scoped, type Scoped } from "@/db/scoped";
import type { Member } from "./can";

export type SessionUser = { id: string; email: string; name: string };
export type School = typeof school.$inferSelect;

/** Everything a service needs: who is acting, in which school, and the school-scoped client. */
export type Ctx = { user: SessionUser; member: Member; school: School; s: Scoped };

/** Null when the user is not a member of the school (callers show "not found"). */
export async function loadCtx(db: DB, user: SessionUser, slug: string): Promise<Ctx | null> {
  const [row] = await db
    .select({ school, membership })
    .from(school)
    .innerJoin(membership, and(eq(membership.schoolId, school.id), eq(membership.userId, user.id)))
    .where(eq(school.slug, slug))
    .limit(1);
  if (!row) return null;
  const m = row.membership;
  return {
    user: { id: user.id, email: user.email, name: user.name },
    school: row.school,
    member: { id: m.id, userId: m.userId, role: m.role, schoolId: m.schoolId },
    s: scoped(db, row.school.id),
  };
}
