import { Avatar, Btn, Card, Field, Icon, Kpi, Pill, Shell, Table, initialsOf, link, palette, type SP } from "../_ui";
import { STUDENTS } from "../_data";

export const metadata = { title: "Sample · Students" };

export default async function Students(props: SP) {
  const pal = await palette(props);
  return (
    <Shell pal={pal} title="Students" active="Students" actions={<Btn><span className="flex items-center gap-1"><Icon name="plus" /> Admit student</span></Btn>}>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Students" value="12" icon="users" strong />
            <Kpi label="In a class" value="11" icon="layers" note="Kai Müller has no class" />
            <Kpi label="Below 75% attendance" value="2" icon="alert" note="आरव शर्मा, Mia Santos" />
            <Kpi label="Fees overdue" value="4" icon="cash" />
          </div>
          <Card title="All students">
            <div className="mb-4 flex flex-wrap gap-2 text-sm">
              {["All 12", "Grade 5-A · 6", "Grade 6-B · 5", "No class · 1"].map((f, i) => (
                <span key={f} className={`${i === 0 ? "a-seg-on" : "a-btn-ghost"} px-3 py-1.5`}>{f}</span>
              ))}
            </div>
            <Table head={["Student", "Class", "Attendance", "Overall", "Fees"]} min={640}>
              {STUDENTS.map((s) => (
                <tr key={s.code} className="a-row">
                  <td className="py-3 pr-3">
                    <a href={link(pal, "/students/leo")} className="flex items-center gap-3">
                      <Avatar initials={initialsOf(s.name)} size="h-9 w-9 text-xs" />
                      <span><span className="block font-semibold">{s.name}</span><span className="a-muted block text-xs">{s.code}</span></span>
                    </a>
                  </td>
                  <td className={s.cls === "No class" ? "a-muted" : ""}>{s.cls}</td>
                  <td>{s.att === null ? <span className="a-muted">—</span> : <Bar value={s.att} />}</td>
                  <td>{s.overall === null ? <span className="a-muted">—</span> : `${s.overall}%`}</td>
                  <td><Pill tone={s.feeTone}>{s.fees}</Pill></td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
        <Card title="Admit a student" className="h-fit">
          <div className="space-y-3">
            <Field label="First name" value="" />
            <Field label="Last name" value="" />
            <Field label="Date of birth" value="" hint="Optional" />
            <Field label="Class" value="Grade 5-A" />
            <p className="a-muted text-xs">The next code will be <strong>STU-0013</strong>.</p>
            <Btn>Admit</Btn>
          </div>
        </Card>
      </div>
    </Shell>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="a-tile block h-2 w-20 overflow-hidden"><span className="block h-full" style={{ width: `${value}%`, background: value < 75 ? "var(--a-over-fg)" : "var(--a-slate)" }} /></span>
      <span className={value < 75 ? "font-semibold text-[var(--a-over-fg)]" : ""}>{value}%</span>
    </span>
  );
}
