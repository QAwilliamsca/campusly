import { notFound } from "next/navigation";
import { Card, PageHeader, TableWrap } from "@/components/ui";
import { can } from "@/lib/can";
import { requireCtx } from "@/lib/session";
import { listAudit } from "@/lib/services/audit";

export const metadata = { title: "Audit log" };

export default async function Audit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireCtx(slug);
  if (!can(ctx.member, "audit.view")) notFound();
  const rows = await listAudit(ctx);
  const fmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: ctx.school.timezone });

  return (
    <>
      <PageHeader title="Audit log" description={`Every change in this school, newest first (latest ${rows.length}). Times in ${ctx.school.timezone}.`} />
      <Card>
        <TableWrap>
          <table className="data-table">
            <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">{fmt.format(r.at)}</td>
                  <td>{r.actor}</td>
                  <td className="font-mono text-xs">{r.action}</td>
                  <td className="max-w-md break-all font-mono text-xs text-muted">{r.after ? JSON.stringify(r.after) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </>
  );
}
