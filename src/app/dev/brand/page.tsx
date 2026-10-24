import { notFound } from "next/navigation";
import { Fraunces, Inter, Nunito_Sans, Plus_Jakarta_Sans, Source_Serif_4, Space_Grotesk } from "next/font/google";
import { Logo } from "@/components/Logo";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge, Card } from "@/components/ui";
import "./kits.css";

export const metadata = { title: "Brand kits" };

const inter = Inter({ subsets: ["latin"], variable: "--f-inter" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--f-serif" });
const nunito = Nunito_Sans({ subsets: ["latin"], variable: "--f-nunito" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--f-fraunces" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--f-jakarta" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--f-grotesk" });

const KITS = [
  { id: "ink", name: "1 · Ink & Paper", mood: "Refined version of today's look. Academic and trustworthy: ink-blue, warm paper, serif headings (Source Serif + Inter)." },
  { id: "evergreen", name: "2 · Evergreen (D-013, replaced by D-019)", mood: "Friendly and natural: deep teal-green, soft rounded cards, warm serif headings (Fraunces + Nunito Sans)." },
  { id: "sunrise", name: "3 · Sunrise", mood: "Warm and energetic: coral-orange, pill buttons, big rounded cards (Plus Jakarta Sans)." },
  { id: "slate", name: "4 · Slate & Violet", mood: "Bold and modern: near-black neutrals, violet accent, tight corners (Space Grotesk + Inter)." },
  { id: "ocean", name: "5 · Ocean & Amber (chosen, D-019)", mood: "Calm and confident: deep navy with sky-blue fills in light mode, amber in dark mode, orange for warnings (Plus Jakarta Sans + Inter). Palette 8ecae6 · 219ebc · 023047 · ffb703 · fb8500." },
  { id: "soft", name: "6 · Soft Dashboard (from your Dribbble reference)", mood: "Bright and friendly: light grey page, white cards with big rounded corners and soft shadows, orange lead, purple focus ring (Plus Jakarta Sans). Light mode uses a deeper orange than the reference so white button text stays readable." },
];

/** Stage 3 brand directions shown as real screens (PLAYBOOK §8.4). Local only. */
export default function BrandKits() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className={`${inter.variable} ${serif.variable} ${nunito.variable} ${fraunces.variable} ${jakarta.variable} ${grotesk.variable} mx-auto max-w-7xl space-y-14 px-4 py-8`}>
      <header>
        <h1 className="text-3xl font-semibold">Campusly brand kits</h1>
        <p className="mt-2 max-w-2xl text-muted">Each kit changes only the tokens in <code>globals.css</code>. Everything below is the real product components. Light and dark side by side; all text pairs pass WCAG AA (≥ 4.5:1).</p>
      </header>
      {KITS.map((k) => (
        <section key={k.id} id={k.id} className="space-y-3">
          <div>
            <h2 className="text-2xl font-semibold">{k.name}</h2>
            <p className="text-muted">{k.mood}</p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {(["light", "dark"] as const).map((mode) => (
              <div key={mode} data-mode={mode} className={`kit kit-${k.id} overflow-hidden rounded-card border border-border`}>
                <Hero />
                <Dashboard />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function Hero() {
  return (
    <div className="border-b border-border px-6 py-8">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-semibold"><Logo /> Campusly</span>
        <span className="flex gap-2"><span className="btn-secondary">Sign in</span><span className="btn-primary">Get started</span></span>
      </div>
      <h2 className="mt-8 max-w-md text-3xl font-semibold leading-tight tracking-tight">One record for every student, shared by the whole school.</h2>
      <p className="mt-3 max-w-md text-sm text-muted">Admins, teachers, parents and students see the same attendance, marks and fees — each only what they should.</p>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Maple Grove School</h2>
        <Badge tone="info">owner</Badge>
      </div>
      <div className="flex gap-4 border-b border-border text-sm">
        <span className="border-b-2 border-accent pb-2 font-medium">Dashboard</span>
        <span className="pb-2 text-muted">Students</span>
        <span className="pb-2 text-muted">Attendance</span>
        <span className="pb-2 text-muted">Fees</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Card><p className="text-xs text-muted">Students</p><p className="text-2xl font-semibold">12</p></Card>
        <Card><p className="text-xs text-muted">Marked today</p><p className="text-2xl font-semibold">1 / 3</p></Card>
        <Card><p className="text-xs text-muted">Outstanding</p><p className="text-2xl font-semibold">$3,455</p></Card>
      </div>
      <Card>
        <table className="data-table">
          <thead><tr><th>Invoice</th><th>Student</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td className="font-mono text-xs">INV-0001</td><td className="text-accent">Leo Santos</td><td><StatusBadge status="partial" overdue={false} /></td></tr>
            <tr><td className="font-mono text-xs">INV-0002</td><td className="text-accent">Aisha Khan</td><td><StatusBadge status="paid" overdue={false} /></td></tr>
            <tr><td className="font-mono text-xs">INV-0010</td><td className="text-accent">Mia Santos</td><td><StatusBadge status="partial" overdue /></td></tr>
          </tbody>
        </table>
      </Card>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1"><span className="label">Student name</span><span className="input flex items-center text-muted">Zoë O&apos;Brien</span></div>
        <span className="btn-primary">Admit</span>
        <span className="btn-secondary">Cancel</span>
      </div>
      <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">Scores must be between 0 and 20.</p>
    </div>
  );
}
