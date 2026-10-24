import { Avatar, Btn, Card, Kpi, Pill, Shell, Table, TEACHER_NAV, initialsOf, link, palette, type SP } from "../_ui";
import { EXAMS, STUDENTS } from "../_data";

export const metadata = { title: "Sample · Teacher dashboard" };

export default async function Teacher(props: SP) {
  const pal = await palette(props);
  const kids = STUDENTS.filter((s) => s.cls === "Grade 5-A");
  return (
    <Shell pal={pal} title="Good morning, Daniel" subtitle="Maple Grove School · Grade 5-A" active="Teacher view" nav={TEACHER_NAV} user={{ name: "Daniel Okafor", role: "Teacher", initials: "DO" }}>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <section className="a-slate flex flex-wrap items-center justify-between gap-4 p-6">
            <div><p className="a-slate-muted text-sm">Today · Saturday, October 24</p><p className="mt-1 text-xl font-bold">Grade 5-A attendance is marked</p><p className="a-slate-muted text-sm">5 present · 1 absent (आरव शर्मा)</p></div>
            <a href={link(pal, "/attendance")} className="a-btn px-4 py-2 text-sm">Review attendance</a>
          </section>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <Kpi label="My students" value="6" icon="users" strong />
            <Kpi label="Class attendance" value="88%" icon="check" note="This term" />
            <Kpi label="Class average" value="78%" icon="doc" note="4 exams" />
          </div>
          <Card title="My exams" action={<Btn>New exam</Btn>}>
            <Table head={["Exam", "Date", "Marked", "Average", "Status"]} min={480}>
              {EXAMS.filter((e) => e.cls === "Grade 5-A").map((e, i) => (
                <tr key={i} className="a-row"><td className="py-3 pr-3 font-semibold">{e.name} · {e.subject}</td><td className="a-muted">{e.date}</td><td>{e.marked}</td><td>{e.avg}</td><td><Pill tone={e.tone}>{e.status}</Pill></td></tr>
              ))}
            </Table>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Needs a check-in">
            {kids.filter((k) => (k.att ?? 100) < 85 || (k.overall ?? 100) < 65).map((k) => (
              <div key={k.code} className="a-row flex items-center gap-3 py-3">
                <Avatar initials={initialsOf(k.name)} size="h-9 w-9 text-xs" />
                <span className="flex-1 text-sm"><span className="block font-semibold">{k.name}</span><span className="a-muted block text-xs">Attendance {k.att}% · overall {k.overall}%</span></span>
              </div>
            ))}
          </Card>
          <Card title="My class">
            <div className="grid grid-cols-3 gap-3">
              {kids.map((k) => (
                <div key={k.code} className="a-tile p-2 text-center"><Avatar initials={initialsOf(k.name)} size="mx-auto h-10 w-10 text-xs" /><p className="mt-1 truncate text-xs font-semibold">{k.name}</p></div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
