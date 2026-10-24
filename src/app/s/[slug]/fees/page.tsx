import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, Empty, Kpi, PageHeader, TableWrap } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { can } from "@/lib/can";
import { formatMoney, minorDigits } from "@/lib/money";
import { requireCtx } from "@/lib/session";
import { listClasses } from "@/lib/services/classes";
import { listInvoices } from "@/lib/services/fees";
import { listStudents } from "@/lib/services/students";
import { billClassAction, createInvoiceAction, recordPaymentAction } from "../actions";

export const metadata = { title: "Fees" };

export default async function Fees({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireCtx(slug);
  if (!can(ctx.member, "fee.manage")) notFound();
  const [invoices, classes, students] = await Promise.all([listInvoices(ctx), listClasses(ctx), listStudents(ctx)]);
  const cur = ctx.school.currency;
  const billed = invoices.reduce((a, i) => a + i.amountMinor, 0);
  const collected = invoices.reduce((a, i) => a + i.paidMinor, 0);
  const overdue = invoices.filter((i) => i.overdue);
  const overdueMinor = overdue.reduce((a, i) => a + i.amountMinor - i.paidMinor, 0);
  const step = minorDigits(cur) ? (1 / 10 ** minorDigits(cur)).toFixed(minorDigits(cur)) : "1";
  const amountField = (
    <div><label className="label" htmlFor="amount">Amount ({cur})</label><input id="amount" name="amount" inputMode="decimal" required maxLength={20} placeholder={step === "1" ? "5000" : "150.00"} className="input" /></div>
  );

  return (
    <>
      <PageHeader title="Fees" description={`All amounts in ${cur}. No payment gateway is connected: payments are recorded manually.`} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Billed" value={formatMoney(billed, cur)} note={`${invoices.length} invoice(s)`} icon={<Icon name="doc" />} />
        <Kpi label="Collected" value={formatMoney(collected, cur)} note={billed ? `${Math.round((collected / billed) * 100)}% of billed` : undefined} icon={<Icon name="cash" />} />
        <Kpi label="Outstanding" value={formatMoney(billed - collected, cur)} icon={<Icon name="alert" />} strong />
        <Kpi label="Overdue" value={formatMoney(overdueMinor, cur)} note={`${overdue.length} invoice(s)`} icon={<Icon name="alert" />} />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Bill a whole class">
          {classes.length === 0 ? <p className="text-sm text-muted">Create a class first.</p> : (
            <ActionForm action={billClassAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2" resetOnSuccess>
              <input type="hidden" name="slug" value={slug} />
              <div><label className="label" htmlFor="bc-class">Class</label><select id="bc-class" name="classId" className="input">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="label" htmlFor="bc-desc">Description</label><input id="bc-desc" name="description" required maxLength={120} placeholder="Term 1 tuition" className="input" /></div>
              {amountField}
              <div><label className="label" htmlFor="bc-due">Due on</label><input id="bc-due" name="dueOn" type="date" required className="input" /></div>
              <div className="sm:col-span-2"><SubmitButton pendingText="Billing…">Create invoices</SubmitButton></div>
            </ActionForm>
          )}
        </Card>
        <Card title="Bill one student">
          {students.length === 0 ? <p className="text-sm text-muted">Admit a student first.</p> : (
            <ActionForm action={createInvoiceAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2" resetOnSuccess>
              <input type="hidden" name="slug" value={slug} />
              <div><label className="label" htmlFor="ci-st">Student</label><select id="ci-st" name="studentId" className="input">{students.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.firstName} {s.lastName}</option>)}</select></div>
              <div><label className="label" htmlFor="ci-desc">Description</label><input id="ci-desc" name="description" required maxLength={120} placeholder="Field trip" className="input" /></div>
              {amountField}
              <div><label className="label" htmlFor="ci-due">Due on</label><input id="ci-due" name="dueOn" type="date" required className="input" /></div>
              <div className="sm:col-span-2"><SubmitButton pendingText="Creating…">Create invoice</SubmitButton></div>
            </ActionForm>
          )}
        </Card>
      </div>
      <Card title="Invoices">
        {invoices.length === 0 ? (
          <Empty title="No invoices yet" hint="Bill a class or a student above." />
        ) : (
          <TableWrap>
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Student</th><th>Description</th><th>Due</th><th>Amount</th><th>Paid</th><th>Status</th><th>Record payment</th></tr></thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td className="whitespace-nowrap font-mono text-xs font-semibold">{i.code}</td>
                    <td><Link className="text-accent hover:underline" href={`/s/${slug}/students/${i.studentId}`}>{i.studentName}</Link></td>
                    <td>{i.description}</td><td className="whitespace-nowrap">{i.dueOn}</td>
                    <td className="whitespace-nowrap">{formatMoney(i.amountMinor, cur)}</td><td className="whitespace-nowrap font-semibold">{formatMoney(i.paidMinor, cur)}</td>
                    <td><StatusBadge status={i.status} overdue={i.overdue} /></td>
                    <td>
                      {i.status !== "paid" && (
                        <ActionForm action={recordPaymentAction} idempotent resetOnSuccess className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="slug" value={slug} />
                          <input type="hidden" name="invoiceId" value={i.id} />
                          <label className="sr-only" htmlFor={`p-${i.id}`}>Amount paid for {i.code}</label>
                          <input id={`p-${i.id}`} name="amount" inputMode="decimal" required maxLength={20} className="input w-24" placeholder="Amount" />
                          <label className="sr-only" htmlFor={`m-${i.id}`}>Method</label>
                          <select id={`m-${i.id}`} name="method" className="input w-24"><option value="cash">Cash</option><option value="bank">Bank</option><option value="card">Card</option><option value="other">Other</option></select>
                          <SubmitButton variant="secondary">Record</SubmitButton>
                        </ActionForm>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
