import { Avatar, Card, Pill, Shell, Stat, PARENT_NAV, palette, type SP } from "../_ui";

export const metadata = { title: "Sample · Parent dashboard" };

const KIDS = [
  { name: "Leo Santos", initials: "LS", cls: "Grade 5-A · STU-0001", att: "100%", overall: "75%", due: "$250", fee: "Partly paid · due Nov 7", tone: "due",
    latest: [["Term 1 English", "81%"], ["Term 1 Science", "70%"], ["Term 1 Maths", "72%"]], note: null },
  { name: "Mia Santos", initials: "MS", cls: "Grade 6-B · STU-0011", att: "60%", overall: "59%", due: "$380", fee: "Overdue since Oct 21", tone: "over",
    latest: [["Term 1 History", "58%"], ["Term 1 Maths", "59%"]], note: "Mia was absent 8 of 20 days this term. Her teacher is Samuel Mensah." },
];

export default async function Parent(props: SP) {
  const pal = await palette(props);
  return (
    <Shell pal={pal} title="Hello, Maria" subtitle="Maple Grove School · your children" active="Parent view" nav={PARENT_NAV} user={{ name: "Maria Santos", role: "Parent", initials: "MS" }}>
      <div className="grid gap-6 lg:grid-cols-2">
        {KIDS.map((k) => (
          <section key={k.name} className="a-card flex flex-col p-6">
            <div className="flex items-center gap-4">
              <Avatar initials={k.initials} size="h-16 w-16 text-lg a-ring" />
              <div><h2 className="text-xl font-bold">{k.name}</h2><p className="a-muted text-sm">{k.cls}</p></div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3"><Stat label="Attendance" value={k.att} /><Stat label="Overall" value={k.overall} /><Stat label="Fees due" value={k.due} /></div>
            {k.note && <p className="a-over mt-4 rounded-xl p-3 text-sm">{k.note}</p>}
            <Card title="Latest marks" className="mt-4 !p-4 !shadow-none">
              {k.latest.map(([e, p]) => <div key={e} className="a-row flex justify-between py-2 text-sm"><span>{e}</span><strong>{p}</strong></div>)}
            </Card>
            <div className="a-tile mt-4 flex items-center justify-between gap-3 p-4"><span className="text-sm font-semibold">Term 1 tuition</span><Pill tone={k.tone}>{k.fee}</Pill></div>
          </section>
        ))}
      </div>
      <p className="a-muted mt-6 text-center text-sm">You see only Leo and Mia. Other families&apos; children never appear here.</p>
    </Shell>
  );
}
