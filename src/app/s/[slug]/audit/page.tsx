import { notFound } from "next/navigation";
import { Avatar, Card, PageHeader, TableWrap } from "@/components/ui";
import { can } from "@/lib/can";
import { requireCtx } from "@/lib/session";
import { listAudit } from "@/lib/services/audit";

export const metadata = { title: "Audit log" };

// Plain-language verbs for each audited action; unknown actions fall back to the raw name.
const VERB: Record<string, string> = {
  "attendance.mark": "marked attendance",
  "class.assign": "assigned a class teacher",
  "class.create": "created a class",
  "document.upload": "uploaded a document",
  "exam.create": "created an exam",
  "invoice.bill_class": "billed a class",
  "invoice.create": "created an invoice",
  "marks.enter": "entered marks",
  "member.invite": "sent an invite",
  "member.join": "joined the school",
  "member.remove": "removed a member",
  "member.revoke": "revoked an invite",
  "payment.record": "recorded a payment",
  "school.create": "created the school",
  "school.update": "changed school settings",
  "student.admit": "admitted a student",
  "student.update": "updated a student",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;
/** "after" values as short key: value chips, without internal IDs. */
function details(after: unknown): string[] {
  if (!after || typeof after !== "object") return [];
  return Object.entries(after as Record<string, unknown>)
    .filter(([k, v]) => !k.endsWith("Id") && !(typeof v === "string" && UUID.test(v)))
    .map(([k, v]) => `${k.replace(/Minor$/, " (minor units)")}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
}

export default async function Audit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireCtx(slug);
  if (!can(ctx.member, "audit.view")) notFound();
  const rows = await listAudit(ctx);
  const fmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: ctx.school.timezone });

  return (
    <>
      <PageHeader title="Audit log" description={`Every change in this school, newest first (latest ${rows.length}). Times in ${ctx.school.timezone}.`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <Card className="min-w-0">
          <TableWrap>
            <table className="data-table">
              <thead><tr><th>Who and what</th><th>Action</th><th>Details</th><th>When</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="flex items-center gap-3">
                        <Avatar name={r.actor} size="h-9 w-9 text-xs" />
                        <span className="text-sm"><span className="font-semibold">{r.actor}</span> {VERB[r.action] ?? r.action}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap font-mono text-xs">{r.action}</td>
                    <td><span className="flex max-w-sm flex-wrap gap-1">{details(r.after).map((d) => <span key={d} className="badge break-all bg-surface-2 font-normal text-muted">{d}</span>)}</span></td>
                    <td className="whitespace-nowrap text-xs text-muted">{fmt.format(r.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
        <section className="panel h-fit p-5">
          <h2 className="text-lg font-semibold">Why this exists</h2>
          <p className="mt-2 text-sm text-panel-muted">Every change records who did it, what changed and when. Nobody can edit or delete these entries, including the owner.</p>
        </section>
      </div>
    </>
  );
}
