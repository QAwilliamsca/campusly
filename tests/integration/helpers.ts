import { connect, type DB } from "@/db/connect";
import { membership, user } from "@/db/schema";
import { loadCtx, type Ctx } from "@/lib/context";
import { createSchool } from "@/lib/services/schools";
import type { Role } from "@/db/schema";

let n = 0;

/** Fresh in-memory Postgres per test file — real SQL, no mocks. */
export const testDb = (): Promise<DB> => connect();

/** A user who has verified their email (D-010). Pass verified:false for the unverified case. */
export async function makeUser(db: DB, label = "user", opts: { verified?: boolean } = {}) {
  n += 1;
  const row = { id: crypto.randomUUID(), name: `${label} ${n}`, email: `${label}${n}@example.com`, emailVerified: opts.verified ?? true };
  await db.insert(user).values(row);
  return row;
}

/** A school with an owner. Returns the owner's context. */
export async function makeSchool(db: DB, opts: { currency?: string; timezone?: string; planId?: string } = {}) {
  const owner = await makeUser(db, "owner");
  const school = await createSchool(db, owner, { name: `School ${n}`, currency: opts.currency ?? "USD", timezone: opts.timezone ?? "UTC" });
  if (opts.planId) await db.execute(`update school set plan_id = '${opts.planId}' where id = '${school.id}'`);
  return (await loadCtx(db, owner, school.slug))!;
}

/** Add a member with a role to the same school as `ctx`; returns their context. */
export async function addMember(db: DB, ctx: Ctx, role: Role): Promise<Ctx> {
  const u = await makeUser(db, role);
  await db.insert(membership).values({ schoolId: ctx.school.id, userId: u.id, role });
  return (await loadCtx(db, u, ctx.school.slug))!;
}

export async function expectCode(p: Promise<unknown>, code: string) {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  if (!err) throw new Error(`expected AppError(${code}) but call succeeded`);
  const got = (err as { code?: string }).code;
  if (got !== code) throw new Error(`expected AppError(${code}) but got ${got ?? String(err)}`);
}
