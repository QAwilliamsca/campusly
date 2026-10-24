import { Btn, Card, Field, Kpi, Pill, Shell, Table, palette, type SP } from "../_ui";
import { INVOICES, money } from "../_data";

export const metadata = { title: "Sample · Fees" };

export default async function Fees(props: SP) {
  const pal = await palette(props);
  return (
    <Shell pal={pal} title="Fees" subtitle="Maple Grove School · all amounts in USD" active="Fees" actions={<><Btn ghost>Bill one student</Btn><Btn>Bill a class</Btn></>}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi label="Billed" value="$5,155" icon="doc" note="13 invoices" />
          <Kpi label="Collected" value="$1,700" icon="cash" note="33% of billed" />
          <Kpi label="Outstanding" value="$3,455" icon="alert" strong />
          <Kpi label="Overdue" value="$1,820" icon="alert" note="4 invoices · all Grade 6-B" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <Card title="Invoices" className="min-w-0">
            <div className="mb-4 flex flex-wrap gap-2 text-sm">
              {["All 13", "Unpaid 4", "Partly paid 1", "Overdue 4", "Paid 4"].map((f, i) => <span key={f} className={`${i === 0 ? "a-seg-on" : "a-btn-ghost"} px-3 py-1.5`}>{f}</span>)}
            </div>
            <Table head={["Invoice", "Student", "For", "Due", "Paid / amount", "Status", ""]} min={760}>
              {INVOICES.map((i) => (
                <tr key={i.code} className="a-row">
                  <td className="py-3 pr-3 font-semibold">{i.code}</td><td>{i.student}</td><td className="a-muted">{i.what}</td><td>{i.due}</td>
                  <td><span className="font-semibold">{money(i.paid)}</span> <span className="a-muted">/ {money(i.amount)}</span></td>
                  <td><Pill tone={i.tone}>{i.status}</Pill></td>
                  <td className="text-right">{i.paid < i.amount && <button type="button" className="a-btn px-3 py-1.5 text-xs">Record</button>}</td>
                </tr>
              ))}
            </Table>
          </Card>
          <Card title="Bill a whole class" className="h-fit">
            <div className="space-y-3">
              <Field label="Class" value="Grade 5-A" />
              <Field label="Description" value="Term 2 tuition" />
              <Field label="Amount (USD)" value="450.00" />
              <Field label="Due on" value="2027-01-15" />
              <p className="a-muted text-xs">Creates one invoice per student (6). No payment gateway: payments are recorded by staff.</p>
              <Btn>Create invoices</Btn>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
