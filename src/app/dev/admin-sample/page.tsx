import { Card, Icon, Kpi, Pill, Shell, Stat, Table, link, palette, type SP } from "./_ui";
import { EXAMS, INVOICES, money } from "./_data";

export const metadata = { title: "Sample · Dashboard" };

const ATTENTION = [
  { title: "Grade 6-B", detail: "Not marked today", action: "Mark now" },
  { title: "Kai Müller", detail: "New admission, no class", action: "Assign class" },
  { title: "Grade 7-C", detail: "No teacher assigned", action: "Assign teacher" },
];

export default async function Dashboard(props: SP) {
  const pal = await palette(props);
  return (
    <Shell pal={pal} title="Dashboard" active="Dashboard">
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Fees outstanding" value="$3,455" icon="cash" strong />
            <Kpi label="Students" value="12" icon="users" />
            <Kpi label="Marked today" value="1 / 3" icon="check" />
            <Kpi label="Overdue invoices" value="4" icon="alert" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Student spotlight" action={<a href={link(pal, "/students/leo")} className="a-link text-sm font-semibold">Open record</a>}>
              <div className="flex flex-col items-center text-center">
                <span className="a-icon a-ring grid h-24 w-24 place-items-center text-2xl font-bold">LS</span>
                <p className="mt-4 text-lg font-bold">Leo Santos</p>
                <p className="a-muted text-sm">STU-0001 · Grade 5-A</p>
                <p className="a-muted text-sm">Guardian: Maria Santos · parent@example.com</p>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3"><Stat label="Attendance" value="100%" /><Stat label="Report card" value="75%" /><Stat label="Fees due" value="$250" /></div>
            </Card>
            <div className="space-y-6">
              <Card title="Classes" action={<a href={link(pal, "/classes")} className="a-link text-sm font-semibold">Manage</a>}>
                <div className="grid grid-cols-3 gap-3">
                  {[["5A", "Grade 5-A", "6 students", "Daniel Okafor"], ["6B", "Grade 6-B", "5 students", "Samuel Mensah"], ["7C", "Grade 7-C", "No students", "No teacher yet"]].map(([i, n, d, t]) => (
                    <div key={n} className="a-tile p-3 text-center">
                      <span className="a-icon mx-auto grid h-12 w-12 place-items-center text-sm font-bold">{i}</span>
                      <p className="mt-2 text-sm font-semibold">{n}</p><p className="a-muted text-xs">{d}</p><p className="a-muted mt-1 text-xs">{t}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <section>
                <h2 className="text-lg font-semibold">Needs attention</h2>
                <div className="a-card mt-3 grid grid-cols-1 gap-3 p-3 sm:grid-cols-3">
                  {ATTENTION.map((a) => (
                    <div key={a.title} className="a-tile flex flex-col items-center p-3 text-center">
                      <p className="text-sm font-semibold">{a.title}</p><p className="a-muted mt-1 text-xs">{a.detail}</p>
                      <button type="button" className="a-btn mt-3 px-3 py-1.5 text-xs">{a.action}</button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
          <Card title="Exams" action={<a href={link(pal, "/exams")} className="a-link text-sm font-semibold">View all</a>}>
            <Table head={["Exam", "Class", "Held", "Class average", "Status"]}>
              {EXAMS.slice(1).map((e) => (
                <tr key={e.name + e.subject + e.cls} className="a-row">
                  <td className="py-3 pr-3 font-semibold">{e.name} · {e.subject}</td><td>{e.cls}</td><td className="a-muted">{e.date}</td><td>{e.avg}</td><td><Pill tone={e.tone}>{e.status}</Pill></td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
        <aside className="space-y-6">
          <Calendar />
          <section>
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Recent invoices</h2><a href={link(pal, "/fees")} className="a-link text-sm font-semibold">All fees</a></div>
            <div className="mt-3 space-y-3">
              {[INVOICES[0]!, INVOICES[1]!, INVOICES[10]!, INVOICES[11]!, INVOICES[12]!].map((i) => (
                <div key={i.code} className="a-card flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0"><p className="text-sm font-semibold">{i.what}</p><p className="a-muted truncate text-xs">{i.student} · {i.code}</p><p className="a-link mt-1 text-sm font-bold">{money(i.amount)}</p></div>
                  <Pill tone={i.tone}>{i.status}</Pill>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </Shell>
  );
}

function Calendar() {
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
  const first = (new Date(y, m, 1).getDay() + 6) % 7; // Monday first
  const days = new Date(y, m + 1, 0).getDate();
  // ponytail: "marked" = weekdays in the last 28 days, matching the seed's 20 school days; not read from the database.
  const marked = (day: number) => { const wd = new Date(y, m, day).getDay(); return day <= d && d - day < 28 && wd !== 0 && wd !== 6; };
  return (
    <section className="a-slate p-5">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Attendance calendar</h2><Icon name="dots" /></div>
      <div className="a-seg mt-4 grid grid-cols-2 p-1 text-sm"><span className="a-seg-on py-2 text-center">Attendance</span><span className="a-seg-off py-2 text-center">Exams</span></div>
      <p className="mt-4 font-semibold">{today.toLocaleString("en-US", { month: "long", year: "numeric" })}</p>
      <div className="mt-3 grid grid-cols-7 gap-y-2 text-center text-xs">
        {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((w) => <span key={w} className="a-slate-muted">{w}</span>)}
        {Array.from({ length: first }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => (
          <span key={day} className={`mx-auto grid h-8 w-8 place-items-center ${day === d ? "a-day-today" : marked(day) ? "a-day-marked" : ""}`}>{String(day).padStart(2, "0")}</span>
        ))}
      </div>
      <p className="a-slate-muted mt-4 text-xs">Filled days: attendance marked. Today: Grade 5-A marked, Grade 6-B not yet.</p>
    </section>
  );
}
