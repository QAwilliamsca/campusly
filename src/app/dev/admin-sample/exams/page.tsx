import { Btn, Card, Icon, Pill, Shell, Table, palette, type SP } from "../_ui";
import { EXAMS, STUDENTS } from "../_data";

export const metadata = { title: "Sample · Exams" };

const SCORES = [72, 91, 58, 84, 66, 97]; // Term 1 Maths, Grade 5-A, out of 100

export default async function Exams(props: SP) {
  const pal = await palette(props);
  const kids = STUDENTS.filter((s) => s.cls === "Grade 5-A");
  return (
    <Shell pal={pal} title="Exams" active="Exams" actions={<Btn><span className="flex items-center gap-1"><Icon name="plus" /> New exam</span></Btn>}>
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <Card title="All exams" className="min-w-0">
          <Table head={["Date", "Exam", "Class", "Out of", "Marked", "Average", "Status"]} min={640}>
            {EXAMS.map((e, i) => (
              <tr key={i} className={`a-row ${i === 1 ? "bg-[var(--a-accent-soft)]" : ""}`}>
                <td className="a-muted py-3 pr-3">{e.date}</td><td className="font-semibold">{e.name} · {e.subject}</td><td>{e.cls}</td><td>{e.max}</td><td>{e.marked}</td><td>{e.avg}</td><td><Pill tone={e.tone}>{e.status}</Pill></td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Enter marks" action={<span className="a-muted text-sm">Term 1 · Maths · 5-A</span>}>
          <p className="a-muted mb-3 text-xs">Out of 100. Leave blank if a student missed it: blank is not zero.</p>
          <div className="space-y-2">
            {kids.map((k, i) => (
              <div key={k.code} className="a-tile flex items-center gap-3 p-2 pl-3">
                <span className="flex-1 text-sm font-semibold">{k.name}</span>
                <input aria-label={`Marks for ${k.name}`} defaultValue={SCORES[i]} className="a-btn-ghost w-20 px-2 py-1.5 text-right text-sm" />
                <span className="a-muted w-12 text-right text-xs">{SCORES[i]}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between"><span className="text-sm">Class average <strong>78.0%</strong></span><Btn>Save marks</Btn></div>
        </Card>
      </div>
    </Shell>
  );
}
