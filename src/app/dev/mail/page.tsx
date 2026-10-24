import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { mailLog } from "@/db/schema";
import { mailSinkEnabled } from "@/lib/mail";

export const metadata = { title: "Mail sink" };
export const dynamic = "force-dynamic";

/** Local mail sink: every dry-run email, so you can open invite and verification links. Opt-in via MAIL_SINK=1. */
export default async function MailSink() {
  if (!mailSinkEnabled()) notFound();
  const mails = await (await getDb()).select().from(mailLog).orderBy(desc(mailLog.at)).limit(50);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Mail sink (dry-run)</h1>
      <p className="mt-1 text-sm text-muted">Local sink (MAIL_SINK=1). Nothing here was delivered to a real inbox. {mails.length} message(s).</p>
      <ul className="mt-6 space-y-3">
        {mails.map((m) => (
          <li key={m.id} className="card p-4">
            <p className="text-xs text-muted">{m.at.toISOString()} · {m.template} · to {m.toMasked}</p>
            <p className="mt-1 font-medium">{m.subject}</p>
            <pre className="mt-2 whitespace-pre-wrap break-all text-sm text-muted">{m.body}</pre>
          </li>
        ))}
      </ul>
    </main>
  );
}
