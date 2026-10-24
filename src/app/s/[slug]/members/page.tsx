import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Avatar, Badge, Card, PageHeader, TableWrap } from "@/components/ui";
import { can, type Member } from "@/lib/can";
import { requireCtx } from "@/lib/session";
import { listInvites, listMembers } from "@/lib/services/members";
import { listStudents } from "@/lib/services/students";
import { inviteAction, removeMemberAction, revokeInviteAction } from "../actions";

export const metadata = { title: "Members" };

export default async function Members({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireCtx(slug);
  if (!can(ctx.member, "member.invite")) notFound();
  const [members, invites, students] = await Promise.all([listMembers(ctx), listInvites(ctx), listStudents(ctx)]);

  return (
    <>
      <PageHeader title="Members" description="Invite admins, teachers, parents and students. Parent and student invites are linked to one student." />
      <ul className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(["owner", "admin", "teacher", "parent", "student"] as const).map((r) => (
          <li key={r} className="card p-4 text-center"><p className="text-2xl font-bold">{members.filter((m) => m.role === r).length}</p><p className="text-xs capitalize text-muted">{r}s</p></li>
        ))}
      </ul>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card title={`Members (${members.length})`} className="min-w-0">
          <TableWrap>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Role</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className="flex items-center gap-3">
                        <Avatar name={m.name} size="h-9 w-9 text-xs" />
                        <span className="min-w-0"><span className="block font-semibold">{m.name}</span><span className="block text-xs text-muted [overflow-wrap:anywhere]">{m.email}</span></span>
                      </span>
                    </td>
                    <td><Badge tone={m.role === "owner" || m.role === "admin" ? "info" : m.role === "teacher" ? "success" : "neutral"}>{m.role}</Badge></td>
                    <td>
                      {canRemove(ctx.member, m) && (
                        <ActionForm action={removeMemberAction}>
                          <input type="hidden" name="slug" value={slug} />
                          <input type="hidden" name="membershipId" value={m.id} />
                          <SubmitButton variant="danger" pendingText="Removing…">Remove<span className="sr-only"> {m.name}</span></SubmitButton>
                        </ActionForm>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
        <div className="space-y-6">
      <Card title="Invite someone">
        <ActionForm action={inviteAction} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1" resetOnSuccess>
          <input type="hidden" name="slug" value={slug} />
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required maxLength={254} className="input" placeholder="name@example.com" /></div>
          <div>
            <label className="label" htmlFor="role">Role</label>
            <select id="role" name="role" className="input"><option value="teacher">Teacher</option>{can(ctx.member, "member.invite_admin") && <option value="admin">Admin</option>}<option value="parent">Parent</option><option value="student">Student</option></select>
          </div>
          <div>
            <label className="label" htmlFor="studentId">Student (parents &amp; students)</label>
            <select id="studentId" name="studentId" className="input"><option value="">— Not linked —</option>{students.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.firstName} {s.lastName}</option>)}</select>
          </div>
          <p className="text-xs text-muted">The link works once, for 7 days, and only for that email address.</p>
          <div><SubmitButton pendingText="Inviting…">Send invite</SubmitButton></div>
        </ActionForm>
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
      </div>
    </>
  );
}

/** Mirrors removeMember's rules so the button only appears when it would work (D-011). */
function canRemove(me: Member, m: { id: string; role: string }) {
  if (m.id === me.id || m.role === "owner") return false;
  return m.role === "admin" ? can(me, "member.remove_staff") : true;
}
