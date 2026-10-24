import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Badge, Card, PageHeader, TableWrap } from "@/components/ui";
import { can } from "@/lib/can";
import { requireCtx } from "@/lib/session";
import { listInvites, listMembers } from "@/lib/services/members";
import { listStudents } from "@/lib/services/students";
import { inviteAction, revokeInviteAction } from "../actions";

export const metadata = { title: "Members" };

export default async function Members({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireCtx(slug);
  if (!can(ctx.member, "member.invite")) notFound();
  const [members, invites, students] = await Promise.all([listMembers(ctx), listInvites(ctx), listStudents(ctx)]);

  return (
    <>
      <PageHeader title="Members" description="Invite admins, teachers, parents and students. Parent and student invites are linked to one student." />
      <Card title="Invite someone" className="mb-6">
        <ActionForm action={inviteAction} className="grid gap-4 sm:grid-cols-4 sm:items-end" resetOnSuccess>
          <input type="hidden" name="slug" value={slug} />
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required maxLength={254} className="input" placeholder="name@example.com" /></div>
          <div>
            <label className="label" htmlFor="role">Role</label>
            <select id="role" name="role" className="input"><option value="teacher">Teacher</option><option value="admin">Admin</option><option value="parent">Parent</option><option value="student">Student</option></select>
          </div>
          <div>
            <label className="label" htmlFor="studentId">Student (parents &amp; students)</label>
            <select id="studentId" name="studentId" className="input"><option value="">— Not linked —</option>{students.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.firstName} {s.lastName}</option>)}</select>
          </div>
          <SubmitButton pendingText="Inviting…">Send invite</SubmitButton>
        </ActionForm>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`Members (${members.length})`}>
          <TableWrap>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
              <tbody>{members.map((m) => <tr key={m.id}><td className="font-medium">{m.name}</td><td className="break-all">{m.email}</td><td><Badge tone="info">{m.role}</Badge></td></tr>)}</tbody>
            </table>
          </TableWrap>
        </Card>
        <Card title={`Pending invites (${invites.length})`}>
          {invites.length === 0 ? <p className="text-sm text-muted">No pending invites.</p> : (
            <ul className="divide-y divide-border">
              {invites.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="min-w-0 break-all text-sm">{i.email} <Badge>{i.role}</Badge></span>
                  <ActionForm action={revokeInviteAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="inviteId" value={i.id} />
                    <SubmitButton variant="danger" pendingText="Revoking…">Revoke</SubmitButton>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
