import { Avatar, Btn, Card, Field, Icon, Pill, Shell, initialsOf, palette, type SP } from "../_ui";
import { CLASSES, STUDENTS } from "../_data";

export const metadata = { title: "Sample · Classes" };

export default async function Classes(props: SP) {
  const pal = await palette(props);
  return (
    <Shell pal={pal} title="Classes" active="Classes" actions={<Btn><span className="flex items-center gap-1"><Icon name="plus" /> New class</span></Btn>}>
      <div className="grid gap-6 lg:grid-cols-3">
        {CLASSES.map((c) => {
          const kids = STUDENTS.filter((s) => s.cls === c.name);
          return (
            <section key={c.name} className="a-card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-xl font-bold">{c.name}</h2><p className="a-muted text-sm">{c.students ? `${c.students} students` : "No students yet"}</p></div>
                <Pill tone={c.tone}>{c.today === "Marked" ? "Marked today" : c.today}</Pill>
              </div>
              <div className="a-slate mt-4 flex items-center gap-3 p-4">
                {c.teacher ? <Avatar initials={initialsOf(c.teacher)} /> : <span className="a-icon-soft grid h-10 w-10 place-items-center"><Icon name="user" /></span>}
                <span><span className="a-slate-muted block text-xs">Class teacher</span><span className="block font-semibold">{c.teacher ?? "Not assigned"}</span></span>
              </div>
              <div className="mt-4 flex -space-x-2">
                {kids.map((k) => <Avatar key={k.code} initials={initialsOf(k.name)} size="h-9 w-9 text-xs a-ring" />)}
                {!kids.length && <p className="a-muted text-sm">Admit students or move them here from the Students page.</p>}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="a-tile p-3"><p className="text-lg font-bold">{c.att === null ? "—" : `${c.att}%`}</p><p className="a-muted text-xs">Avg attendance</p></div>
                <div className="a-tile p-3"><p className="text-lg font-bold">{c.name === "Grade 5-A" ? "4" : c.name === "Grade 6-B" ? "3" : "0"}</p><p className="a-muted text-xs">Exams</p></div>
              </div>
              <div className="mt-auto pt-4">{c.teacher ? <Btn ghost>Change teacher</Btn> : <Btn>Assign a teacher</Btn>}</div>
            </section>
          );
        })}
      </div>
      <Card title="New class" className="mt-6 max-w-xl">
        <div className="flex flex-wrap items-end gap-3"><div className="min-w-56 flex-1"><Field label="Class name" value="" hint="For example: Grade 8-A" /></div><Btn>Create class</Btn></div>
      </Card>
    </Shell>
  );
}
