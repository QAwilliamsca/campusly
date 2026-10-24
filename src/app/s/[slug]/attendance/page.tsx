import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Avatar, Card, Empty, Kpi, PageHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { ATTENDANCE } from "@/db/schema";
import { hasAnyGrant } from "@/lib/can";
import { requireCtx } from "@/lib/session";
import { todayIn } from "@/lib/time";
import { listClasses } from "@/lib/services/classes";
import { classAttendance } from "@/lib/services/attendance";
import { listStudents } from "@/lib/services/students";
import { markAttendanceAction } from "../actions";

export const metadata = { title: "Attendance" };

export default async function Attendance({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ class?: string; date?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const ctx = await requireCtx(slug);
  if (!hasAnyGrant(ctx.member, "attendance.mark")) notFound();
  const today = todayIn(ctx.school.timezone);
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) && sp.date <= today ? sp.date : today;
  const classes = await listClasses(ctx);
  const cls = classes.find((c) => c.id === sp.class) ?? classes[0];

  if (!cls) {
    return (
      <>
        <PageHeader title="Attendance" />
        <Empty title={ctx.member.role === "teacher" ? "You aren't assigned to a class" : "No classes yet"} hint="Attendance is marked per class." />
      </>
    );
  }

  const [students, existing] = await Promise.all([listStudents(ctx), classAttendance(ctx, { classId: cls.id, date })]);
  const roster = students.filter((s) => s.classId === cls.id);
  const status = new Map(existing.map((r) => [r.studentId, r.status]));

  return (
    <>
      <PageHeader title="Attendance" description={existing.length ? `Already marked for ${date}. Saving again updates it.` : `Not marked yet for ${date}.`}>
        <form className="flex flex-wrap items-end gap-2">
          <div><label className="label" htmlFor="class">Class</label><select id="class" name="class" defaultValue={cls.id} className="input">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label" htmlFor="date">Date</label><input id="date" name="date" type="date" max={today} defaultValue={date} className="input" /></div>
          <button className="btn-secondary">Show</button>
        </form>
      </PageHeader>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={`Students in ${cls.name}`} value={roster.length} icon={<Icon name="users" />} strong />
        <Kpi label="Present" value={existing.filter((r) => r.status === "present").length} note={existing.length ? `on ${date}` : "Not marked yet"} icon={<Icon name="check" />} />
        <Kpi label="Late" value={existing.filter((r) => r.status === "late").length} icon={<Icon name="list" />} />
        <Kpi label="Absent" value={existing.filter((r) => r.status === "absent").length} icon={<Icon name="alert" />} />
      </div>
      <Card title={`${cls.name} · ${date}`}>
        {roster.length === 0 ? (
          <Empty title={`${cls.name} has no students`} hint="Admit students into this class first." />
        ) : (
          <ActionForm action={markAttendanceAction}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="classId" value={cls.id} />
            <input type="hidden" name="date" value={date} />
            <ul className="space-y-2">
              {roster.map((s) => (
                <li key={s.id} className="tile flex flex-wrap items-center gap-3 p-3">
                  <Avatar name={`${s.firstName} ${s.lastName}`} size="h-9 w-9 text-xs" />
                  <span className="min-w-40 flex-1"><span className="block font-semibold">{s.firstName} {s.lastName}</span><span className="block font-mono text-xs text-muted">{s.code}</span></span>
                  <span className="flex gap-1 rounded-control bg-surface p-1">
                    {ATTENDANCE.map((opt) => (
                      <label key={opt} className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-control px-3 text-sm font-medium text-muted ${opt === "absent" ? "has-checked:bg-danger-soft has-checked:text-danger" : opt === "late" ? "has-checked:bg-warn-soft has-checked:text-warn" : "has-checked:bg-cta has-checked:text-cta-fg"}`}>
                        <input type="radio" name={`status:${s.id}`} value={opt} defaultChecked={(status.get(s.id) ?? "present") === opt} className="h-4 w-4 accent-accent" />
                        <span className="sr-only">{s.firstName} {s.lastName}: {opt}</span>
                        <span aria-hidden="true" className="capitalize">{opt}</span>
                      </label>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4"><SubmitButton>Save attendance</SubmitButton></div>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
