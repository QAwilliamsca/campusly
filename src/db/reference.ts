import { plan } from "./schema";
import type { DB } from "./connect";

/** Reference data every environment needs (PLAYBOOK §16.1 "seed reference data"). Idempotent. */
export async function seedReference(db: DB) {
  await db
    .insert(plan)
    .values([
      { id: "trial", name: "Trial", limitKind: "students", limitValue: 50 },
      { id: "standard", name: "Standard", limitKind: "students", limitValue: 1000 },
    ])
    .onConflictDoNothing();
}
