import { sql } from "drizzle-orm";
import { counter } from "./schema";
import type { Scoped } from "./scoped";

/**
 * Next human code for a school, e.g. STU-0001 (PLAYBOOK §10 "Audit & codes").
 * One atomic upsert: Postgres row-locks the counter, so two concurrent admissions
 * can never get the same number. Never derived from timestamps.
 */
export async function nextCode(s: Scoped, kind: string, prefix: string): Promise<string> {
  const [row] = await s
    .insert(counter, { kind, value: 1 })
    .onConflictDoUpdate({ target: [counter.schoolId, counter.kind], set: { value: sql`${counter.value} + 1` as unknown as number } })
    .returning();
  return `${prefix}-${String(row!.value).padStart(4, "0")}`;
}
