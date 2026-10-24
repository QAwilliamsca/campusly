import { and, count, eq, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { Conn } from "./connect";

/** Any table that belongs to a school. */
type Tenant = PgTable & { schoolId: PgColumn };
type Row<T extends Tenant> = T["$inferSelect"];
type NewRow<T extends Tenant> = Omit<T["$inferInsert"], "schoolId">;
type Returning<T extends Tenant> = { returning(): Promise<Row<T>[]> };
type Insert<T extends Tenant> = Returning<T> & {
  onConflictDoUpdate(cfg: { target: PgColumn | PgColumn[]; set: Partial<Row<T>> }): Returning<T>;
  onConflictDoNothing(cfg?: { target: PgColumn | PgColumn[] }): Returning<T>;
};

/** Everything feature code may do with the database — always inside one school. */
export interface Scoped {
  schoolId: string;
  findMany<T extends Tenant>(t: T, where?: SQL, opts?: { orderBy?: (SQL | PgColumn)[]; limit?: number }): Promise<Row<T>[]>;
  findOne<T extends Tenant>(t: T, where?: SQL): Promise<Row<T> | null>;
  /** SELECT … FOR UPDATE — lock a row for the rest of the transaction. */
  lockOne<T extends Tenant>(t: T, where: SQL): Promise<Row<T> | null>;
  count<T extends Tenant>(t: T, where?: SQL): Promise<number>;
  insert<T extends Tenant>(t: T, values: NewRow<T> | NewRow<T>[]): Insert<T>;
  update<T extends Tenant>(t: T, set: Partial<NewRow<T>>, where: SQL): Promise<Row<T>[]>;
  delete<T extends Tenant>(t: T, where: SQL): Promise<Row<T>[]>;
  /** Run `fn` in one DB transaction, still scoped to this school. */
  transaction<R>(fn: (tx: Scoped) => Promise<R>): Promise<R>;
  /** Raw connection for the db/ helpers (codes, audit, global) — never used by feature code. */
  _conn: Conn;
}

/**
 * The tenancy wall (PLAYBOOK §10). Every read and write made through this object is
 * automatically filtered to one school. Feature code never sees the raw connection
 * (lint rule in eslint.config.mjs), so it cannot forget the filter.
 *
 * `c` is loosely typed on purpose: this is the only place drizzle's generics are
 * bypassed, and the Scoped interface above keeps every call site fully typed.
 */
export function scoped(conn: Conn, schoolId: string): Scoped {
  const own = (t: Tenant, where?: SQL) => and(eq(t.schoolId, schoolId), where);
  const c = conn as any;
  return {
    schoolId,
    findMany(t, where, opts = {}) {
      let q = c.select().from(t).where(own(t, where));
      if (opts.orderBy) q = q.orderBy(...opts.orderBy);
      if (opts.limit) q = q.limit(opts.limit);
      return q;
    },
    async findOne(t, where) {
      const rows = await c.select().from(t).where(own(t, where)).limit(1);
      return rows[0] ?? null;
    },
    async lockOne(t, where) {
      const rows = await c.select().from(t).where(own(t, where)).limit(1).for("update");
      return rows[0] ?? null;
    },
    async count(t, where) {
      const [row] = await c.select({ n: count() }).from(t).where(own(t, where));
      return Number(row?.n ?? 0);
    },
    insert(t, values) {
      const list = (Array.isArray(values) ? values : [values]).map((v) => ({ ...v, schoolId }));
      return c.insert(t).values(list);
    },
    update(t, set, where) {
      return c.update(t).set(set).where(own(t, where)).returning();
    },
    delete(t, where) {
      return c.delete(t).where(own(t, where)).returning();
    },
    transaction(fn) {
      return c.transaction((tx: Conn) => fn(scoped(tx, schoolId)));
    },
    _conn: conn,
  };
}
