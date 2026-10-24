import { Btn, Card, Icon, Pill, Shell, Stat, Table, link, palette, type SP } from "../../_ui";

export const metadata = { title: "Sample · Leo Santos" };

const MARKS = [
  ["Unit Test 1", "Maths", "38 / 50", 76], ["Term 1", "Maths", "72 / 100", 72], ["Term 1", "Science", "35 / 50", 70], ["Term 1", "English", "81 / 100", 81],
] as const;
const DAYS = ["Oct 13", "Oct 14", "Oct 15", "Oct 16", "Oct 19", "Oct 20", "Oct 21", "Oct 22", "Oct 23", "Oct 24"];

export default async function StudentDetail(props: SP) {
  const pal = await palette(props);
  return (
    <Shell pal={pal} title="Leo Santos" subtitle="Students › STU-0001" active="Students" actions={<><Btn ghost>Edit details</Btn><Btn>Record payment</Btn></>}>
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-col items-center text-center">
              <span className="a-icon a-ring grid h-24 w-24 place-items-center text-2xl font-bold">LS</span>
              <p className="mt-4 text-lg font-bold">Leo Santos</p>
              <p className="a-muted text-sm">STU-0001 · Grade 5-A · Born Mar 12, 2015</p>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3"><Stat label="Attendance" value="100%" /><Stat label="Overall" value="75%" /><Stat label="Fees due" value="$250" /></div>
          </Card>
          <Card title="Guardians">
            <div className="a-tile flex items-center gap-3 p-3">
              <span className="a-icon-soft grid h-10 w-10 place-items-center"><Icon name="user" /></span>
              <span><span className="block text-sm font-semibold">Maria Santos</span><span className="a-muted block text-xs">parent@example.com · also Mia Santos (6-B)</span></span>
            </div>
          </Card>
          <Card title="Documents" action={<a href="#" className="a-link text-sm font-semibold">Upload</a>}>
            {["Birth certificate.pdf", "Photo.png"].map((f) => (
              <div key={f} className="a-row flex items-center gap-3 py-2 text-sm"><Icon name="file" /><span className="flex-1">{f}</span><span className="a-muted text-xs">1 KB</span></div>
            ))}
          </Card>
        </div>
        <div className="min-w-0 space-y-6">
          <Card title="Attendance · last 10 school days" action={<span className="a-muted text-sm">21 present · 0 late · 0 absent</span>}>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {DAYS.map((d) => (
                <div key={d} className="a-tile p-2 text-center"><span className="a-paid mx-auto grid h-8 w-8 place-items-center rounded-full text-xs font-bold">P</span><span className="a-muted mt-1 block text-[11px]">{d}</span></div>
              ))}
            </div>
          </Card>
          <Card title="Report card" action={<span className="text-sm font-bold">Overall 75%</span>}>
            <Table head={["Exam", "Subject", "Score", "%"]} min={420}>
              {MARKS.map(([e, s, sc, p]) => (
                <tr key={e + s} className="a-row"><td className="py-3 pr-3 font-semibold">{e}</td><td>{s}</td><td>{sc}</td>
                  <td><span className="flex items-center gap-2"><span className="a-tile block h-2 w-24 overflow-hidden"><span className="block h-full" style={{ width: `${p}%`, background: "var(--a-slate)" }} /></span>{p}%</span></td></tr>
              ))}
            </Table>
          </Card>
          <Card title="Fees">
            <div className="a-tile flex flex-wrap items-center justify-between gap-3 p-4">
              <span><span className="block text-sm font-semibold">INV-0001 · Term 1 tuition</span><span className="a-muted block text-xs">Due Nov 7 · $200.00 of $450.00 paid</span></span>
              <Pill tone="due">Partly paid</Pill>
            </div>
            <p className="a-muted mt-3 text-xs"><a href={link(pal, "/fees")} className="a-link font-semibold">See all fees</a></p>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
