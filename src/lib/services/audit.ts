import { desc } from "drizzle-orm";
import { auditLog } from "@/db/schema";
import { usersByIds } from "@/db/global";
import type { Ctx } from "../context";
import { assertCan } from "../errors";

/** S-08: the latest audit rows for this school. */
export async function listAudit(ctx: Ctx, limit = 200) {
  assertCan(ctx.member, "audit.view");
  const rows = await ctx.s.findMany(auditLog, undefined, { orderBy: [desc(auditLog.at)], limit });
  const users = await usersByIds(ctx.s, [...new Set(rows.map((r) => r.actorUserId).filter((x): x is string => !!x))]);
  return rows.map((r) => ({ ...r, actor: (r.actorUserId && users.get(r.actorUserId)?.name) || "—" }));
}
