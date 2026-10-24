import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Avatar, Card, Empty, Kpi, PageHeader, TableWrap } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { hasAnyGrant, isStaff } from "@/lib/can";
import { requireCtx } from "@/lib/session";
import { listClasses } from "@/lib/services/classes";
import { listStudents } from "@/lib/services/students";
import { admitStudentAction } from "../actions";

export const metadata = { title: "Students" };

export default async function Students({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> }) {
  const { slug } = await params;
  const { q = "" } = await searchParams;
  const ctx = await requireCtx(slug);
  if (!hasAnyGrant(ctx.member, "student.view") || !(isStaff(ctx.member) || ctx.member.role === "teacher")) notFound();
  const [all, classes] = await Promise.all([listStudents(ctx), listClasses(ctx)]);
  const className = new Map(classes.map((c) => [c.id, c.name]));
  const needle = q.trim().toLowerCase();
  // ponytail: in-memory search over the visible list; move to SQL ILIKE + pagination past ~2,000 students.
  const students = needle ? all.filter((s) => `${s.code} ${s.firstName} ${s.lastName}`.toLowerCase().includes(needle)) : all;
  const staff = isStaff(ctx.member);

  return (
    <>
      <PageHeader title="Students" description={`${all.length} student(s)${ctx.member.role === "teacher" ? " in your classes" : ""}.`}>
        <form role="search" className="flex gap-2">
          <label htmlFor="q" className="sr-only">Search students</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search name or code" className="input w-56" maxLength={100} />
          <button className="btn-secondary">Search</button>
        </form>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Students" value={all.length} icon={<Icon name="users" />} strong />
        <Kpi label="In a class" value={all.filter((s) => s.classId).length} icon={<Icon name="layers" />} />
        <Kpi label="No class yet" value={all.filter((s) => !s.classId).length} icon={<Icon name="alert" />} />
        <Kpi label="Classes" value={classes.length} icon={<Icon name="grid" />} />
      </div>

      <div className={staff ? "grid gap-6 xl:grid-cols-[1fr_340px]" : ""}>
        {staff && (
          <Card title="Admit a student" className="h-fit xl:order-2">
            <ActionForm action={admitStudentAction} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1" resetOnSuccess>
              <input type="hidden" name="slug" value={slug} />
              <div><label className="label" htmlFor="firstName">First name</label><input id="firstName" name="firstName" required maxLength={100} className="input" /></div>
              <div><label className="label" htmlFor="lastName">Last name</label><input id="lastName" name="lastName" required maxLength={100} className="input" /></div>
              <div><label className="label" htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" name="dateOfBirth" type="date" className="input" /></div>
              <div>
                <label className="label" htmlFor="classId">Class</label>
                <select id="classId" name="classId" className="input"><option value="">— None —</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <div><SubmitButton pendingText="Admitting…">Admit</SubmitButton></div>
            </ActionForm>
          </Card>
        )}

        <Card title="All students" className="min-w-0 xl:order-1">
          {students.length === 0 ? (
            <Empty title={needle ? `No students match "${q}"` : "No students yet"} hint={staff && !needle ? "Admit your first student with the Admit form." : undefined} />
          ) : (
            <TableWrap>
              <table className="data-table">
                <thead><tr><th>Student</th><th>Code</th><th>Class</th></tr></thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className="flex items-center gap-3">
                          <Avatar name={`${s.firstName} ${s.lastName}`} size="h-9 w-9 text-xs" />
                          <Link className="font-semibold hover:text-accent hover:underline" href={`/s/${slug}/students/${s.id}`}>{s.firstName} {s.lastName}</Link>
                        </span>
                      </td>
                      <td className="font-mono text-xs">{s.code}</td>
                      <td>{(s.classId && className.get(s.classId)) || <span className="text-muted">No class</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>
      </div>
    </>
  );
}
