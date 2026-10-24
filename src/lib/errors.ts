import type { z } from "zod";
import { can, type Action, type Member, type Resource } from "./can";

export type ErrorCode = "invalid" | "forbidden" | "not_found" | "conflict" | "limit";

/** An error that is safe to show the user. Anything else becomes "Something went wrong (ref …)". */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what = "Record") => new AppError("not_found", `${what} not found.`);

export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const r = schema.safeParse(input);
  if (r.success) return r.data;
  const issue = r.error.issues[0];
  const field = issue?.path.join(".");
  throw new AppError("invalid", `${field ? field + ": " : ""}${issue?.message ?? "Invalid input"}`);
}

export function assertCan(member: Member, action: Action, resource?: Resource) {
  if (!can(member, action, resource)) throw new AppError("forbidden", "You don't have permission to do that.");
}

/** Postgres unique-constraint violation (23505), however the driver wraps it. */
export function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23505" || err?.cause?.code === "23505";
}
