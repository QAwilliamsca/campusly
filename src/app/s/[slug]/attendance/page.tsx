import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Card, Empty, PageHeader, TableWrap } from "@/components/ui";
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
      <Card>
        {roster.length === 0 ? (
          <Empty title={`${cls.name} has no students`} hint="Admit students into this class first." />
        ) : (
          <ActionForm action={markAttendanceAction}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="classId" value={cls.id} />
            <input type="hidden" name="date" value={date} />
            <TableWrap>
              <table className="data-table">
                <thead><tr><th>Student</th>{ATTENDANCE.map((s) => <th key={s} className="capitalize">{s}</th>)}</tr></thead>
                <tbody>
                  {roster.map((s) => (
                    <tr key={s.id}>
                      <td><span className="font-medium">{s.firstName} {s.lastName}</span> <span className="font-mono text-xs text-muted">{s.code}</span></td>
                      {ATTENDANCE.map((opt) => (
                        <td key={opt}>
                          <label className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center">
                            <span className="sr-only">{s.firstName} {s.lastName}: {opt}</span>
                            <input type="radio" name={`status:${s.id}`} value={opt} defaultChecked={(status.get(s.id) ?? "present") === opt} className="h-5 w-5 accent-accent" />
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <div className="mt-4"><SubmitButton>Save attendance</SubmitButton></div>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
