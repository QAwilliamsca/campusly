import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Avatar, Badge, Card, Empty, PageHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
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
      {classes.length === 0 ? (
        <Card><Empty title="No classes yet" hint="Create one above. Then admit students into it and assign a teacher." /></Card>
      ) : (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => {
            const kids = students.filter((s) => s.classId === c.id);
            const teacher = teachers.find((t) => t.id === c.teacherMembershipId);
            return (
              <li key={c.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="text-xl font-bold">{c.name}</h2><p className="text-sm text-muted">{kids.length} student(s)</p></div>
                  {teacher ? <Badge tone="success">Has a teacher</Badge> : <Badge tone="warn">No teacher</Badge>}
                </div>
                <div className="panel mt-4 flex items-center gap-3 p-4">
                  {teacher ? <Avatar name={teacher.name} /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-panel-2"><Icon name="user" /></span>}
                  <span><span className="block text-xs text-panel-muted">Class teacher</span><span className="block font-semibold">{teacher?.name ?? "Not assigned"}</span></span>
                </div>
                {kids.length > 0 && (
                  <div className="mt-4 flex flex-wrap -space-x-2" aria-hidden="true">
                    {kids.slice(0, 8).map((k) => <span key={k.id} className="rounded-full ring-2 ring-surface"><Avatar name={`${k.firstName} ${k.lastName}`} size="h-9 w-9 text-xs" /></span>)}
                  </div>
                )}
                <ActionForm action={assignTeacherAction} className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="classId" value={c.id} />
                  <label className="sr-only" htmlFor={`t-${c.id}`}>Teacher for {c.name}</label>
                  <select id={`t-${c.id}`} name="teacherMembershipId" defaultValue={c.teacherMembershipId ?? ""} className="input min-w-0 flex-1">
                    <option value="">— Unassigned —</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <SubmitButton variant="secondary">Save</SubmitButton>
                </ActionForm>
              </li>
            );
          })}
        </ul>
      )}
      {teachers.length === 0 && classes.length > 0 && <p className="mt-3 text-sm text-muted">No teachers yet. Invite one from Members.</p>}
    </>
  );
}
