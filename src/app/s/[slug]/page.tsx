import Link from "next/link";
import { Avatar, Badge, Card, Empty, Kpi, PageHeader, pct } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { isStaff } from "@/lib/can";
import { formatMoney } from "@/lib/money";
import { requireCtx } from "@/lib/session";
import { todayIn } from "@/lib/time";
import { listClasses } from "@/lib/services/classes";
import { listMembers } from "@/lib/services/members";
import { listStudents } from "@/lib/services/students";
import { attendanceSummary, classAttendance } from "@/lib/services/attendance";
import { reportCard } from "@/lib/services/exams";
import { listInvoices } from "@/lib/services/fees";

export const metadata = { title: "Dashboard" };

const longDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });

export default async function Dashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireCtx(slug);
  const base = `/s/${slug}`;
  const today = todayIn(ctx.school.timezone);
  const cur = ctx.school.currency;

  if (isStaff(ctx.member) || ctx.member.role === "teacher") {
    const staff = isStaff(ctx.member);
    const [classes, students, members] = await Promise.all([listClasses(ctx), listStudents(ctx), staff ? listMembers(ctx) : Promise.resolve([])]);
    // ponytail: one query per class; fine for tens of classes, batch into one query past ~100.
    const marked = await Promise.all(classes.map(async (c) => ({ c, n: (await classAttendance(ctx, { classId: c.id, date: today })).length })));
    const invoices = staff ? await listInvoices(ctx) : [];
    const due = invoices.reduce((a, i) => a + (i.amountMinor - i.paidMinor), 0);
    const overdue = invoices.filter((i) => i.overdue);
    const teacherName = new Map(members.map((m) => [m.id, m.name]));
    const size = (classId: string) => students.filter((s) => s.classId === classId).length;
    const markedCount = marked.filter((m) => m.n > 0).length;
    const toMark = marked.filter((m) => m.n === 0 && size(m.c.id) > 0).length; // empty classes have nothing to mark
    const attention = staff
      ? [
          ...marked.filter((m) => m.n === 0 && size(m.c.id) > 0).map((m) => ({ key: `m${m.c.id}`, title: m.c.name, detail: "Not marked today", href: `${base}/attendance?class=${m.c.id}`, action: "Mark now" })),
          ...students.filter((s) => !s.classId).map((s) => ({ key: `s${s.id}`, title: `${s.firstName} ${s.lastName}`, detail: "No class yet", href: `${base}/students/${s.id}`, action: "Assign class" })),
          ...classes.filter((c) => !c.teacherMembershipId).map((c) => ({ key: `t${c.id}`, title: c.name, detail: "No teacher assigned", href: `${base}/classes`, action: "Assign teacher" })),
        ]
      : [];

    return (
      <>
        <PageHeader title="Dashboard" description={`Today is ${today} (${ctx.school.timezone}).`} />
        <div className={`grid grid-cols-2 gap-4 ${staff ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {staff && <Kpi label="Fees outstanding" value={formatMoney(due, cur)} icon={<Icon name="cash" />} strong />}
          <Kpi label="Students" value={students.length} icon={<Icon name="users" />} strong={!staff} />
          <Kpi label="Classes marked today" value={`${markedCount} / ${classes.length}`} icon={<Icon name="check" />} />
          {staff && <Kpi label="Overdue" value={overdue.length} note={overdue.length > 0 ? `${overdue.length} overdue invoice(s)` : "Nothing overdue"} icon={<Icon name="alert" />} />}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6">
            <Card title={ctx.member.role === "teacher" ? "Your classes" : "Classes"}>
              {classes.length === 0 ? (
                <Empty
                  title={ctx.member.role === "teacher" ? "You don't teach any class yet" : "No classes yet"}
                  hint={ctx.member.role === "teacher" ? "Ask an admin to assign you to a class." : "Create your first class, then admit students into it."}
                  action={staff ? { href: `${base}/classes`, label: "Create a class" } : undefined}
                />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {marked.map(({ c, n }) => (
                    <li key={c.id} className="tile flex flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold">{c.name}</span>
                        {n > 0 ? <Badge tone="success">Marked today</Badge> : size(c.id) === 0 ? <Badge>No students</Badge> : <Badge tone="warn">Not marked</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted">{size(c.id)} student(s){staff && ` · ${c.teacherMembershipId ? teacherName.get(c.teacherMembershipId) ?? "Teacher" : "no teacher"}`}</p>
                      <Link className="btn-secondary mt-4" href={`${base}/attendance?class=${c.id}`}>Attendance</Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            {staff && attention.length > 0 && (
              <Card title="Needs attention">
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {attention.map((a) => (
                    <li key={a.key} className="tile flex flex-col items-start p-4">
                      <span className="font-semibold">{a.title}</span>
                      <span className="text-sm text-muted">{a.detail}</span>
                      <Link href={a.href} className="btn-primary mt-3 min-h-9 px-3 text-xs">{a.action}</Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          <aside className="space-y-6">
            <section className="panel p-5">
              <p className="text-sm text-panel-muted">Today · {longDate(today)}</p>
              <p className="mt-2 text-xl font-bold">{classes.length === 0 ? "Create a class to start" : toMark === 0 ? "Every class is marked" : `${toMark} class(es) still to mark`}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel-2" aria-hidden="true">
                <div className="h-full rounded-full bg-cta" style={{ width: `${classes.length ? (markedCount / classes.length) * 100 : 0}%` }} />
              </div>
              <Link href={`${base}/attendance`} className="btn-primary mt-4">Open attendance</Link>
            </section>
            {staff && (
              <Card title="Recent invoices">
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted">No invoices yet. Bill a class from the Fees page.</p>
                ) : (
                  <ul className="space-y-3">
                    {invoices.slice(-5).reverse().map((i) => (
                      <li key={i.id} className="tile flex items-center justify-between gap-3 p-3">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{i.description}</span>
                          <span className="block truncate text-xs text-muted">{i.studentName} · {i.code}</span>
                          <span className="block text-sm font-bold text-accent">{formatMoney(i.amountMinor, cur)}</span>
                        </span>
                        <StatusBadge status={i.status} overdue={i.overdue} />
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={`${base}/fees`} className="mt-4 inline-block text-sm font-semibold text-accent">All fees</Link>
              </Card>
            )}
          </aside>
        </div>
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
      <PageHeader title={ctx.member.role === "parent" ? "Your children" : "Your record"} description={`${ctx.school.name} · today is ${today}.`} />
      {cards.length === 0 ? (
        <Empty title="No student is linked to your account yet" hint="Ask the school to send you an invite linked to your child." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {cards.map(({ k, att, rc, inv }) => {
            const owed = inv.reduce((a, i) => a + i.amountMinor - i.paidMinor, 0);
            const late = inv.some((i) => i.overdue);
            return (
              <Link key={k.id} href={`${base}/students/${k.id}`} className="card block p-6 transition-colors hover:bg-surface-2">
                <span className="flex items-center gap-4">
                  <Avatar name={`${k.firstName} ${k.lastName}`} size="h-14 w-14 text-lg" />
                  <span className="min-w-0">
                    <span className="block text-xl font-bold">{k.firstName} {k.lastName}</span>
                    <span className="block text-sm text-muted">{k.code}</span>
                  </span>
                </span>
                <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="tile p-3"><dt className="text-xs text-muted">Attendance</dt><dd className="text-lg font-bold">{pct(att.percent)}</dd></div>
                  <div className="tile p-3"><dt className="text-xs text-muted">Overall marks</dt><dd className="text-lg font-bold">{pct(rc.overall)}</dd></div>
                  <div className="tile p-3"><dt className="text-xs text-muted">Fees due</dt><dd className="text-lg font-bold">{formatMoney(owed, cur)}</dd></div>
                </dl>
                {late && <span className="mt-4 block rounded-control bg-danger-soft p-3 text-sm text-danger">A fee is past its due date.</span>}
                <span className="mt-4 block text-sm font-semibold text-accent">Open full record</span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
