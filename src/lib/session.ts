import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { getAuth } from "./auth";
import { loadCtx, type SessionUser } from "./context";

export async function currentUser(): Promise<SessionUser | null> {
  const session = await (await getAuth()).api.getSession({ headers: await headers() });
  return session ? { id: session.user.id, email: session.user.email, name: session.user.name } : null;
}

/** Only same-site relative paths — blocks open redirects (PLAYBOOK §20.3). */
export const safeNext = (next: unknown, fallback = "/schools") =>
  typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;

export async function requireUser(next = "/schools") {
  const user = await currentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}

/** Signed-in member of this school, or 404 — never reveals whether the school exists. */
export async function requireCtx(slug: string) {
  const user = await requireUser(`/s/${slug}`);
  const ctx = await loadCtx(await getDb(), user, slug);
  if (!ctx) notFound();
  return ctx;
}
