import { Btn, Card, Field, Shell, palette, type SP } from "../_ui";

export const metadata = { title: "Sample · Settings" };

export default async function Settings(props: SP) {
  const pal = await palette(props);
  return (
    <Shell pal={pal} title="Settings" active="Settings">
      <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
        <Card title="School">
          <div className="space-y-3">
            <Field label="School name" value="Maple Grove School" />
            <Field label="Currency" value="USD" hint="Locked once the first invoice exists, so amounts are never rescaled." />
            <Field label="Timezone" value="America/New_York" hint={`"Today" for attendance follows this timezone.`} />
            <Btn>Save changes</Btn>
          </div>
        </Card>
        <div className="space-y-6">
          <Card title="Usage">
            <div className="space-y-4 text-sm">
              {[["Document storage", "3 files", 2], ["Schools you own", "1 of 3", 33]].map(([l, v, p]) => (
                <div key={l as string}><div className="flex justify-between"><span>{l}</span><span className="a-muted">{v}</span></div>
                  <span className="a-tile mt-2 block h-2 overflow-hidden"><span className="block h-full" style={{ width: `${p}%`, background: "var(--a-slate)" }} /></span></div>
              ))}
              <p className="a-muted text-xs">Limits: 500 MB of documents per school, 3 schools per account (D-012).</p>
            </div>
          </Card>
          <Card title="Your account">
            <p className="text-sm font-semibold">Priya Natarajan</p>
            <p className="a-muted text-sm">principal@example.com · Owner</p>
            <div className="mt-4 flex gap-2"><Btn ghost>Change password</Btn><Btn ghost>Sign out</Btn></div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
