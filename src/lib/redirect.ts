/**
 * Only same-site paths survive (PLAYBOOK §20.3 open redirects). Parsed with the URL
 * parser — the same one the browser uses — so tricks like "/\t/evil.com" that become
 * "//evil.com" after the browser strips the tab are caught.
 */
export function safeNext(next: unknown, fallback = "/schools"): string {
  if (typeof next !== "string" || !next.startsWith("/")) return fallback;
  try {
    const base = "http://campusly.invalid";
    const u = new URL(next, base);
    return u.origin === base ? u.pathname + u.search + u.hash : fallback;
  } catch {
    return fallback;
  }
}
