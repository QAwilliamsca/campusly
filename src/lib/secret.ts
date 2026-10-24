const DEV_SECRET = "dev-only-insecure-secret-change-me-0123456789";

/** Server secret. Production refuses to start without a real one (PLAYBOOK §2.1). */
export function serverSecret(): string {
  const s = process.env.BETTER_AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("BETTER_AUTH_SECRET is required in production");
  return DEV_SECRET;
}
