import { connect, type DB } from "./connect";

// One database per process. Cached on globalThis so Next.js hot reload never opens the PGlite folder twice.
const g = globalThis as unknown as { campuslyDb?: Promise<DB> };

export function getDb(): Promise<DB> {
  g.campuslyDb ??= connect({ url: process.env.DATABASE_URL || undefined, dir: process.env.PGLITE_DIR || ".data/pglite" });
  return g.campuslyDb;
}
