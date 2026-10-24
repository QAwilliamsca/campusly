/**
 * The app's public base URL, for auth and for links in emails.
 * APP_URL wins; inside GitHub Codespaces the forwarded https address is derived automatically;
 * otherwise local development on port 3000.
 */
export function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  const { CODESPACE_NAME: cs, GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: domain } = process.env;
  if (cs && domain) return `https://${cs}-${process.env.PORT || 3000}.${domain}`;
  return "http://localhost:3000";
}
