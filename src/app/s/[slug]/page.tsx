import Link from "next/link";
import { Badge, Card, Empty, PageHeader, pct } from "@/components/ui";
import { isStaff } from "@/lib/can";
import { formatMoney } from "@/lib/money";
import { requireCtx } from "@/lib/session";
import { todayIn } from "@/lib/time";
import { listClasses } from "@/lib/services/classes";
import { listStudents } from "@/lib/services/students";
import { attendanceSummary, classAttendance } from "@/lib/services/attendance";
import { reportCard } from "@/lib/services/exams";
import { listInvoices } from "@/lib/services/fees";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireCtx(slug);
  const base = `/s/${slug}`;
  const today = todayIn(ctx.school.timezone);

  if (isStaff(ctx.member) || ctx.member.role === "teacher") {
    const [classes, students] = await Promise.all([listClasses(ctx), listStudents(ctx)]);
    // ponytail: one query per class; fine for tens of classes, batch into one query past ~100.
    const marked = await Promise.all(classes.map(async (c) => ({ c, n: (await classAttendance(ctx, { classId: c.id, date: today })).length })));
    const invoices = isStaff(ctx.member) ? await listInvoices(ctx) : [];
    const due = invoices.reduce((a, i) => a + (i.amountMinor - i.paidMinor), 0);
    const overdue = invoices.filter((i) => i.overdue).length;
    return (
      <>
        <PageHeader title="Dashboard" description={`Today is ${today} (${ctx.school.timezone}).`} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><p className="text-sm text-muted">Students</p><p className="mt-1 text-3xl font-semibold">{students.length}</p></Card>
          <Card><p className="text-sm text-muted">Classes marked today</p><p className="mt-1 text-3xl font-semibold">{marked.filter((m) => m.n > 0).length} / {classes.length}</p></Card>
          {isStaff(ctx.member) && (
            <Card><p className="text-sm text-muted">Fees outstanding</p><p className="mt-1 text-3xl font-semibold">{formatMoney(due, ctx.school.currency)}</p>{overdue > 0 && <p className="mt-1 text-sm text-warn">{overdue} overdue invoice(s)</p>}</Card>
          )}
        </div>
        <Card title={ctx.member.role === "teacher" ? "Your classes" : "Classes"} className="mt-6">
          {classes.length === 0 ? (
            <Empty
              title={ctx.member.role === "teacher" ? "You don't teach any class yet" : "No classes yet"}
              hint={ctx.member.role === "teacher" ? "Ask an admin to assign you to a class." : "Create your first class, then admit students into it."}
              action={isStaff(ctx.member) ? { href: `${base}/classes`, label: "Create a class" } : undefined}
            />
          ) : (
            <ul className="divide-y divide-border">
              {marked.map(({ c, n }) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="font-medium">{c.name}</span>
                  <span className="flex items-center gap-3">
                    {n > 0 ? <Badge tone="success">Marked today</Badge> : <Badge tone="warn">Not marked</Badge>}
                    <Link className="btn-secondary" href={`${base}/attendance?class=${c.id}`}>Attendance</Link>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </>
    );
  }

  // Parents and students: one card per child they can see.
  const kids = await listStudents(ctx);
  const cards = await Promise.all(
    kids.map(async (k) => ({ k, att: await attendanceSummary(ctx, k.id), rc: await reportCard(ctx, k.id), inv: await listInvoices(ctx, { studentId: k.id }) })),
  );
  return (
    <>
      <PageHeader title={ctx.member.role === "parent" ? "Your children" : "Your record"} />
      {cards.length === 0 ? (
        <Empty title="No student is linked to your account yet" hint="Ask the school to send you an invite linked to your child." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map(({ k, att, rc, inv }) => (
            <Link key={k.id} href={`${base}/students/${k.id}`} className="card block p-5 hover:bg-surface-2">
              <p className="font-semibold">{k.firstName} {k.lastName}</p>
              <p className="text-sm text-muted">{k.code}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-muted">Attendance</dt><dd className="text-lg font-semibold">{pct(att.percent)}</dd></div>
                <div><dt className="text-muted">Overall marks</dt><dd className="text-lg font-semibold">{pct(rc.overall)}</dd></div>
                <div><dt className="text-muted">Fees due</dt><dd className="text-lg font-semibold">{formatMoney(inv.reduce((a, i) => a + i.amountMinor - i.paidMinor, 0), ctx.school.currency)}</dd></div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
