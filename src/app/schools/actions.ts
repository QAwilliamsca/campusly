"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/session";
import { createSchool } from "@/lib/services/schools";
import { acceptInvite } from "@/lib/services/members";
import { run } from "@/lib/run";
import type { Result } from "@/lib/result";

export async function createSchoolAction(_: Result, fd: FormData): Promise<Result> {
  const user = await requireUser();
  let slug = "";
  const res = await run(async () => {
    slug = (await createSchool(await getDb(), user, { name: fd.get("name"), currency: fd.get("currency"), timezone: fd.get("timezone") })).slug;
  });
  if (res?.ok) redirect(`/s/${slug}`);
  return res;
}

export async function acceptInviteAction(_: Result, fd: FormData): Promise<Result> {
  const token = String(fd.get("token") ?? "");
  const user = await requireUser(`/invite/${token}`);
  let slug = "";
  const res = await run(async () => {
    slug = (await acceptInvite(await getDb(), user, token)).slug;
  });
  if (res?.ok) redirect(`/s/${slug}`);
  return res;
}
