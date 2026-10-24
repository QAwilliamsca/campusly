import { AppError } from "./errors";
import type { Result } from "./result";

/**
 * Central error handler for server actions (PLAYBOOK §10 Errors): users get a
 * friendly message; unexpected errors get a reference ID and full details go to the log.
 */
export async function run(fn: () => Promise<string | void>): Promise<Result> {
  try {
    const message = await fn();
    return { ok: true, message: message || undefined, at: Date.now() };
  } catch (e) {
    if (e instanceof AppError) return { ok: false, error: e.message, at: Date.now() };
    const ref = crypto.randomUUID().slice(0, 8);
    console.error(`[error ref=${ref}]`, e);
    return { ok: false, error: `Something went wrong. Please try again (ref ${ref}).`, at: Date.now() };
  }
}
