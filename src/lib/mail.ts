import type { Conn } from "@/db/connect";
import { mailLog } from "@/db/schema";

export const maskEmail = (e: string) => {
  const [u = "", d = ""] = e.split("@");
  return `${u.slice(0, 1)}***@${d}`;
};

/**
 * The ONE way to send mail (PLAYBOOK §10 Mail). Phase 1 has no mail provider
 * (Stage 8 is below the cut line), so every message is a dry run: stored in
 * mail_log (the local sink) and printed with the address masked. Nothing can
 * reach a real inbox.
 */
export async function sendMail(conn: Conn, m: { to: string; subject: string; text: string; template: string }) {
  const toMasked = maskEmail(m.to);
  await conn.insert(mailLog).values({ toMasked, subject: m.subject, template: m.template, body: m.text, status: "dry-run" });
  console.info(`[mail:dry-run] ${m.template} → ${toMasked}`);
}

export const appUrl = () => process.env.APP_URL || "http://localhost:3000";
