import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Card, Empty, PageHeader, TableWrap } from "@/components/ui";
import { can } from "@/lib/can";
import { requireCtx } from "@/lib/session";
import { listClasses } from "@/lib/services/classes";
import { listMembers } from "@/lib/services/members";
import { listStudents } from "@/lib/services/students";
import { assignTeacherAction, createClassAction } from "../actions";

export const metadata = { title: "Classes" };

export default async function Classes({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireCtx(slug);
  if (!can(ctx.member, "class.manage")) notFound();
  const [classes, members, students] = await Promise.all([listClasses(ctx), listMembers(ctx), listStudents(ctx)]);
  const teachers = members.filter((m) => m.role === "teacher");

  return (
    <>
      <PageHeader title="Classes" description="Create classes and assign one teacher to each." />
      <Card title="New class" className="mb-6">
        <ActionForm action={createClassAction} className="flex flex-wrap items-end gap-3" resetOnSuccess>
          <input type="hidden" name="slug" value={slug} />
          <div className="min-w-0 flex-1"><label className="label" htmlFor="name">Class name</label><input id="name" name="name" required maxLength={60} placeholder="Grade 5-A" className="input" /></div>
          <SubmitButton pendingText="Creating…">Create class</SubmitButton>
        </ActionForm>
      </Card>
      <Card>
        {classes.length === 0 ? (
          <Empty title="No classes yet" hint="Create one above. Then admit students into it and assign a teacher." />
        ) : (
          <TableWrap>
            <table className="data-table">
              <thead><tr><th>Class</th><th>Students</th><th>Teacher</th></tr></thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td>{students.filter((s) => s.classId === c.id).length}</td>
                    <td>
                      <ActionForm action={assignTeacherAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="classId" value={c.id} />
                        <label className="sr-only" htmlFor={`t-${c.id}`}>Teacher for {c.name}</label>
                        <select id={`t-${c.id}`} name="teacherMembershipId" defaultValue={c.teacherMembershipId ?? ""} className="input w-48">
                          <option value="">— Unassigned —</option>
                          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <SubmitButton variant="secondary">Save</SubmitButton>
                      </ActionForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
        {teachers.length === 0 && classes.length > 0 && <p className="mt-3 text-sm text-muted">No teachers yet. Invite one from Members.</p>}
      </Card>
    </>
  );
}
