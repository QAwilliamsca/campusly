import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Badge, Card, Empty, PageHeader, TableWrap, pct } from "@/components/ui";
import { can, hasAnyGrant, isStaff } from "@/lib/can";
import { AppError } from "@/lib/errors";
import { formatMoney } from "@/lib/money";
import { requireCtx } from "@/lib/session";
import { listClasses } from "@/lib/services/classes";
import { getStudent } from "@/lib/services/students";
import { attendanceSummary } from "@/lib/services/attendance";
import { reportCard } from "@/lib/services/exams";
import { listInvoices } from "@/lib/services/fees";
import { listDocuments } from "@/lib/services/documents";
import { updateStudentAction, uploadDocumentAction } from "../../actions";
import { StatusBadge } from "@/components/StatusBadge";

export default async function StudentPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const ctx = await requireCtx(slug);
  const st = await getStudent(ctx, id).catch((e) => {
    if (e instanceof AppError) notFound();
    throw e;
  });
  const staff = isStaff(ctx.member);
  const [att, rc, invoices, docs, classes] = await Promise.all([
    attendanceSummary(ctx, st.id),
    reportCard(ctx, st.id),
    hasAnyGrant(ctx.member, "fee.view") ? listInvoices(ctx, { studentId: st.id }) : null,
    can(ctx.member, "document.manage") ? listDocuments(ctx, st.id) : null,
    staff ? listClasses(ctx) : [],
  ]);

  return (
    <>
      <PageHeader title={`${st.firstName} ${st.lastName}`} description={`${st.code} · ${st.className ?? "No class"}${st.dateOfBirth ? ` · Born ${st.dateOfBirth}` : ""}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Attendance">
          <p className="text-3xl font-semibold">{pct(att.percent)}</p>
          <p className="text-sm text-muted">{att.marked === 0 ? "No days marked yet." : `${att.present} present · ${att.late} late · ${att.absent} absent of ${att.marked} day(s)`}</p>
          {att.recent.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {att.recent.map((r) => (
                <li key={r.id}><Badge tone={r.status === "present" ? "success" : r.status === "late" ? "warn" : "danger"}>{r.onDate}: {r.status}</Badge></li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Report card">
          {rc.rows.length === 0 ? (
            <Empty title="No marks yet" hint="Marks appear here once a teacher enters them." />
          ) : (
            <TableWrap>
              <table className="data-table">
                <thead><tr><th>Exam</th><th>Subject</th><th>Score</th><th>%</th></tr></thead>
                <tbody>
                  {rc.rows.map((r) => (
                    <tr key={`${r.examName}-${r.subject}-${r.heldOn}`}><td>{r.examName}</td><td>{r.subject}</td><td>{r.score} / {r.max}</td><td>{pct(r.percent)}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan={3} className="px-3 py-2 font-medium">Overall</td><td className="px-3 py-2 font-semibold">{pct(rc.overall)}</td></tr></tfoot>
              </table>
            </TableWrap>
          )}
        </Card>

        {invoices && (
          <Card title="Fees">
            {invoices.length === 0 ? (
              <Empty title="No invoices" />
            ) : (
              <TableWrap>
                <table className="data-table">
                  <thead><tr><th>Invoice</th><th>Description</th><th>Amount</th><th>Paid</th><th>Status</th></tr></thead>
                  <tbody>
                    {invoices.map((i) => (
                      <tr key={i.id}>
                        <td className="font-mono text-xs">{i.code}</td><td>{i.description}</td>
                        <td>{formatMoney(i.amountMinor, i.currency)}</td><td>{formatMoney(i.paidMinor, i.currency)}</td>
                        <td><StatusBadge status={i.status} overdue={i.overdue} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </Card>
        )}

        {docs && (
          <Card title="Documents">
            {docs.length === 0 ? <p className="text-sm text-muted">No documents uploaded.</p> : (
              <ul className="space-y-2 text-sm">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2">
                    <a className="truncate font-medium text-accent hover:underline" href={d.url}>{d.filename}</a>
                    <span className="shrink-0 text-muted">{Math.ceil(d.size / 1024)} KB</span>
                  </li>
                ))}
              </ul>
            )}
            <ActionForm action={uploadDocumentAction} encType="multipart/form-data" className="mt-4 flex flex-wrap items-end gap-3" resetOnSuccess>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="studentId" value={st.id} />
              <div className="min-w-0 flex-1">
                <label className="label" htmlFor="file">Upload PDF, PNG or JPG (max 5 MB)</label>
                <input id="file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required className="block w-full text-sm" />
              </div>
              <SubmitButton pendingText="Uploading…">Upload</SubmitButton>
            </ActionForm>
          </Card>
        )}

        {staff && (
          <Card title="Edit details">
            <ActionForm action={updateStudentAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={st.id} />
              <input type="hidden" name="version" value={st.version} />
              <div><label className="label" htmlFor="firstName">First name</label><input id="firstName" name="firstName" defaultValue={st.firstName} required maxLength={100} className="input" /></div>
              <div><label className="label" htmlFor="lastName">Last name</label><input id="lastName" name="lastName" defaultValue={st.lastName} required maxLength={100} className="input" /></div>
              <div><label className="label" htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={st.dateOfBirth ?? ""} className="input" /></div>
              <div>
                <label className="label" htmlFor="classId">Class</label>
                <select id="classId" name="classId" defaultValue={st.classId ?? ""} className="input"><option value="">— None —</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <div className="sm:col-span-2"><SubmitButton>Save changes</SubmitButton></div>
            </ActionForm>
          </Card>
        )}
      </div>
    </>
  );
}
