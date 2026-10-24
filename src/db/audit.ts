import { auditLog } from "./schema";
import type { Scoped } from "./scoped";

/** One audit row per mutation: who, what, before/after (IDs and plain fields only — no secrets). */
export async function audit(
  s: Scoped,
  actorUserId: string,
  action: string,
  entity: string,
  entityId: string,
  change: { before?: unknown; after?: unknown } = {},
) {
  await s.insert(auditLog, { actorUserId, action, entity, entityId, before: change.before ?? null, after: change.after ?? null });
}
