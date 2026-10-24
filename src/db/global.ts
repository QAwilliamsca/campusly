import { eq, inArray, sql } from "drizzle-orm";
import { document, plan, school, user } from "./schema";
import type { Scoped } from "./scoped";

// Reads of global (non-tenant) tables needed by feature code. Kept here, inside db/,
// so the raw connection never leaves this folder.

export async function userByEmail(s: Scoped, email: string) {
  const [row] = await s._conn.select().from(user).where(eq(sql`lower(${user.email})`, email.toLowerCase())).limit(1);
  return row ?? null;
}

export async function usersByIds(s: Scoped, ids: string[]) {
  if (!ids.length) return new Map<string, { name: string; email: string }>();
  const rows = await s._conn.select({ id: user.id, name: user.name, email: user.email }).from(user).where(inArray(user.id, ids));
  return new Map(rows.map((r) => [r.id, r]));
}

export async function planOf(s: Scoped) {
  const [row] = await s._conn.select({ plan }).from(school).innerJoin(plan, eq(plan.id, school.planId)).where(eq(school.id, s.schoolId));
  return row!.plan;
}

export async function storageUsedBytes(s: Scoped): Promise<number> {
  const [row] = await s._conn.select({ n: sql<string>`coalesce(sum(${document.size}), 0)` }).from(document).where(eq(document.schoolId, s.schoolId));
  return Number(row?.n ?? 0);
}
