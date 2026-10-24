import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

/** Smoke check: app is up and the database answers. */
export async function GET() {
  await (await getDb()).execute(sql`select 1`);
  return Response.json({ ok: true });
}
