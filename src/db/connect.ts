import { mkdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { migrate as migratePg } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";
import { seedReference } from "./reference";

export type DB = ReturnType<typeof drizzle<typeof schema>>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export type Conn = DB | Tx;

const migrationsFolder = path.join(process.cwd(), "drizzle");

/** Open a database and bring it to the latest migration. `dir` undefined = in-memory (tests). */
export async function connect(opts: { url?: string; dir?: string } = {}): Promise<DB> {
  if (opts.url) {
    const db = drizzlePg(postgres(opts.url), { schema });
    await migratePg(db, { migrationsFolder });
    // Same query API; only the driver differs.
    const typed = db as unknown as DB;
    await seedReference(typed);
    return typed;
  }
  if (opts.dir) mkdirSync(opts.dir, { recursive: true });
  const db = drizzle({ client: new PGlite(opts.dir), schema });
  await migrate(db, { migrationsFolder });
  await seedReference(db);
  return db;
}
