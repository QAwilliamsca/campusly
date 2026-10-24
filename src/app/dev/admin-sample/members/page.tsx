import { Avatar, Btn, Card, Field, Pill, Shell, Table, initialsOf, palette, type SP } from "../_ui";
import { MEMBERS } from "../_data";

export const metadata = { title: "Sample · Members" };

const TONE: Record<string, string> = { Owner: "paid", Admin: "paid", Teacher: "due", Parent: "neutral", Student: "neutral" };

export default async function Members(props: SP) {
  const pal = await palette(props);
  return (
    <Shell pal={pal} title="Members" active="Members">
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[["1", "Owner"], ["1", "Admin"], ["3", "Teachers"], ["3", "Parents"], ["2", "Students"]].map(([n, l]) => (
              <div key={l} className="a-card p-4 text-center"><p className="text-2xl font-bold">{n}</p><p className="a-muted text-xs">{l}</p></div>
            ))}
          </div>
          <Card title="Members (10)">
            <Table head={["Name", "Role", "Linked to", ""]} min={560}>
              {MEMBERS.map((m) => (
                <tr key={m.email} className="a-row">
                  <td className="py-3 pr-3"><span className="flex items-center gap-3"><Avatar initials={initialsOf(m.name)} size="h-9 w-9 text-xs" /><span><span className="block font-semibold">{m.name}</span><span className="a-muted block text-xs">{m.email}</span></span></span></td>
                  <td><Pill tone={TONE[m.role]!}>{m.role}</Pill></td>
                  <td className="a-muted">{m.note ?? "—"}</td>
                  <td className="text-right">{m.role !== "Owner" && <button type="button" className="a-btn-ghost px-3 py-1.5 text-xs">Remove</button>}</td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Invite someone">
            <div className="space-y-3">
              <Field label="Email" value="" />
              <Field label="Role" value="Teacher" hint="Only the owner can invite admins." />
              <Field label="Linked student" value="—" hint="For parents and students only." />
              <p className="a-muted text-xs">The link works once, for 7 days, and only for that email address.</p>
              <Btn>Send invite</Btn>
            </div>
          </Card>
          <Card title="Pending invites (2)">
            {[["new.teacher@example.com", "Teacher"], ["sofia.parent@example.com", "Parent · Sofia Rossi"]].map(([e, r]) => (
              <div key={e} className="a-row flex items-center justify-between gap-2 py-3 text-sm">
                <span className="min-w-0"><span className="block truncate font-semibold">{e}</span><span className="a-muted block text-xs">{r}</span></span>
                <button type="button" className="a-btn-ghost px-3 py-1.5 text-xs">Revoke</button>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Shell>
  );
}
