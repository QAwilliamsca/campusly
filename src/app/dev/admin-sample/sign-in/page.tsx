import { Bare, Btn, Field, Icon, link, palette, type SP } from "../_ui";

export const metadata = { title: "Sample · Sign in" };

const DEMO = [["principal@example.com", "Owner"], ["admin@example.com", "Admin"], ["teacher@example.com", "Teacher, Grade 5-A"], ["parent@example.com", "Parent of two"], ["student@example.com", "Student"]];

export default async function SignIn(props: SP) {
  const pal = await palette(props);
  return (
    <Bare pal={pal}>
      <div className="grid min-h-dvh lg:grid-cols-2">
        <section className="a-slate m-4 hidden flex-col justify-between rounded-[28px] p-10 lg:flex">
          <span className="flex items-center gap-2 text-xl font-bold"><Icon name="cap" /> Campusly</span>
          <div>
            <p className="text-4xl font-bold leading-tight">One record for every student, shared by the whole school.</p>
            <p className="a-slate-muted mt-4 max-w-md">Admins, teachers, parents and students see the same attendance, marks and fees, each only what they should.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["12", "students"], ["3", "classes"], ["$1,700", "collected"]].map(([n, l]) => <div key={l} className="a-seg p-3 text-[var(--a-text)]"><p className="text-xl font-bold">{n}</p><p className="a-muted text-xs">{l}</p></div>)}
          </div>
        </section>
        <section className="flex items-center justify-center p-6 pr-16">
          <div className="w-full max-w-sm">
            <span className="flex items-center gap-2 text-xl font-bold lg:hidden"><Icon name="cap" /> Campusly</span>
            <h1 className="mt-6 text-3xl font-bold lg:mt-0">Welcome back</h1>
            <p className="a-muted mt-1 text-sm">Sign in to your school.</p>
            <div className="mt-6 space-y-3">
              <Field label="Email" value="" />
              <Field label="Password" value="" />
              <div className="flex justify-between text-sm"><span /><a href="#" className="a-link font-semibold">Forgot password?</a></div>
              <div className="[&>button]:w-full"><Btn>Sign in</Btn></div>
            </div>
            <div className="a-card mt-6 p-4">
              <p className="text-sm font-semibold">Demo accounts</p>
              <p className="a-muted text-xs">Fictional people. Every password is campusly-demo-1.</p>
              <ul className="mt-2 space-y-1 text-sm">{DEMO.map(([e, r]) => <li key={e} className="flex justify-between gap-2"><span className="truncate">{e}</span><span className="a-muted shrink-0 text-xs">{r}</span></li>)}</ul>
            </div>
            <p className="mt-4 text-center text-sm"><a href={link(pal, "")} className="a-link font-semibold">Back to the sample dashboard</a></p>
          </div>
        </section>
      </div>
    </Bare>
  );
}
