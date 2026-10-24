import { Avatar, Btn, Card, Kpi, Shell, initialsOf, palette, type SP } from "../_ui";
import { STUDENTS } from "../_data";

export const metadata = { title: "Sample · Attendance" };

// Grade 5-A on 2026-10-24, as saved in the demo data: everyone present except आरव (absent).
const TODAY: Record<string, string> = { "STU-0005": "Absent" };

export default async function Attendance(props: SP) {
  const pal = await palette(props);
  const kids = STUDENTS.filter((s) => s.cls === "Grade 5-A");
  return (
    <Shell pal={pal} title="Attendance" active="Attendance">
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <div className="a-card flex flex-wrap items-center gap-3 p-3">
            {["Grade 5-A", "Grade 6-B", "Grade 7-C"].map((c, i) => <span key={c} className={`${i === 0 ? "a-seg-on" : "a-btn-ghost"} px-4 py-2 text-sm`}>{c}</span>)}
            <span className="a-search ml-auto px-4 py-2 text-sm">Sat, Oct 24, 2026</span>
          </div>
          <Card title="Grade 5-A · Saturday, October 24" action={<span className="a-paid a-pill">Already marked · saving again updates it</span>}>
            <div className="space-y-2">
              {kids.map((k) => {
                const v = TODAY[k.code] ?? "Present";
                return (
                  <div key={k.code} className="a-tile flex flex-wrap items-center gap-3 p-3">
                    <Avatar initials={initialsOf(k.name)} size="h-9 w-9 text-xs" />
                    <span className="min-w-36 flex-1"><span className="block text-sm font-semibold">{k.name}</span><span className="a-muted block text-xs">{k.code} · {k.att}% this term</span></span>
                    <span className="a-seg flex p-1 text-sm" role="radiogroup" aria-label={`${k.name} attendance`}>
                      {["Present", "Late", "Absent"].map((o) => (
                        <span key={o} role="radio" aria-checked={o === v} className={`px-3 py-1.5 ${o === v ? (o === "Absent" ? "a-over a-pill" : "a-seg-on") : "a-muted"}`}>{o}</span>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3"><Btn>Save attendance</Btn><Btn ghost>Mark all present</Btn></div>
          </Card>
        </div>
        <div className="space-y-4">
          <Kpi label="Present today" value="5 / 6" icon="check" strong />
          <Kpi label="Absent today" value="1" icon="alert" note="आरव शर्मा" />
          <Kpi label="Class this term" value="88%" icon="layers" note="21 school days marked" />
          <Card title="Still to mark today"><p className="text-sm"><strong>Grade 6-B</strong> · Samuel Mensah</p><p className="a-muted mt-1 text-xs">Grade 7-C has no students.</p></Card>
        </div>
      </div>
    </Shell>
  );
}
