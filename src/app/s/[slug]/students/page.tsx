import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Card, Empty, PageHeader, TableWrap } from "@/components/ui";
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

  return (
    <>
      <PageHeader title="Students" description={`${all.length} student(s)${ctx.member.role === "teacher" ? " in your classes" : ""}.`}>
        <form role="search" className="flex gap-2">
          <label htmlFor="q" className="sr-only">Search students</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search name or code" className="input w-56" maxLength={100} />
          <button className="btn-secondary">Search</button>
        </form>
      </PageHeader>

      {isStaff(ctx.member) && (
        <Card title="Admit a student" className="mb-6">
          <ActionForm action={admitStudentAction} className="grid gap-4 sm:grid-cols-5 sm:items-end" resetOnSuccess>
            <input type="hidden" name="slug" value={slug} />
            <div><label className="label" htmlFor="firstName">First name</label><input id="firstName" name="firstName" required maxLength={100} className="input" /></div>
            <div><label className="label" htmlFor="lastName">Last name</label><input id="lastName" name="lastName" required maxLength={100} className="input" /></div>
            <div><label className="label" htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" name="dateOfBirth" type="date" className="input" /></div>
            <div>
              <label className="label" htmlFor="classId">Class</label>
              <select id="classId" name="classId" className="input"><option value="">— None —</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <SubmitButton pendingText="Admitting…">Admit</SubmitButton>
          </ActionForm>
        </Card>
      )}

      <Card>
        {students.length === 0 ? (
          <Empty title={needle ? `No students match "${q}"` : "No students yet"} hint={isStaff(ctx.member) && !needle ? "Admit your first student with the form above." : undefined} />
        ) : (
          <TableWrap>
            <table className="data-table">
              <thead><tr><th>Code</th><th>Name</th><th>Class</th></tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.code}</td>
                    <td><Link className="font-medium text-accent hover:underline" href={`/s/${slug}/students/${s.id}`}>{s.firstName} {s.lastName}</Link></td>
                    <td>{(s.classId && className.get(s.classId)) || "—"}</td>
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
