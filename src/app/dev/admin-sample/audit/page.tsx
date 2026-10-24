import { Avatar, Card, Icon, Shell, initialsOf, palette, type SP } from "../_ui";
import { AUDIT } from "../_data";

export const metadata = { title: "Sample · Audit log" };

export default async function Audit(props: SP) {
  const pal = await palette(props);
  return (
    <Shell pal={pal} title="Audit log" subtitle="Every change in Maple Grove School, newest first" active="Audit log">
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <Card title="Today · October 24" className="min-w-0">
          <ol className="relative space-y-1">
            {AUDIT.map((a, i) => (
              <li key={i} className="a-row flex items-center gap-3 py-3">
                <Avatar initials={initialsOf(a.who)} size="h-9 w-9 text-xs" />
                <span className="min-w-0 flex-1 text-sm"><strong>{a.who}</strong> {a.what}<span className="a-muted block text-xs">{a.detail}</span></span>
                <span className="a-icon-soft hidden h-9 w-9 place-items-center sm:grid"><Icon name={a.kind} /></span>
                <span className="a-muted w-16 text-right text-xs">5:26 AM</span>
              </li>
            ))}
          </ol>
          <p className="a-muted mt-4 text-center text-sm">Showing 14 of 87 changes · <a href="#" className="a-link font-semibold">Load more</a></p>
        </Card>
        <div className="space-y-4">
          <Card title="Filter">
            <div className="flex flex-wrap gap-2 text-sm">
              {["Everything", "Fees", "Members", "Exams", "Attendance", "Documents"].map((f, i) => <span key={f} className={`${i === 0 ? "a-seg-on" : "a-btn-ghost"} px-3 py-1.5`}>{f}</span>)}
            </div>
          </Card>
          <Card title="Why this exists"><p className="a-muted text-sm">Every change records who did it, what changed, and the value before and after. Nobody can edit or delete these entries.</p></Card>
        </div>
      </div>
    </Shell>
  );
}
