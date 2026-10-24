import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icon";
import { demoMode } from "@/lib/demo";

const FEATURES: [IconName, string, string][] = [
  ["users", "Students & classes", "Admissions with automatic student codes, class lists and teacher assignment."],
  ["check", "Attendance", "Teachers mark a class in under a minute. Parents see it the same day."],
  ["doc", "Exams & report cards", "Enter marks once; report cards calculate themselves."],
  ["cash", "Fees", "Bill a whole class, record payments, see what's due at a glance."],
];

export default function Home() {
  // On the classroom demo sign-up is closed (D-015), so every call to action goes to sign-in.
  const start = demoMode() ? { href: "/sign-in", label: "Try the demo" } : { href: "/sign-up", label: "Create your school" };
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between gap-3 pr-14">
        <span className="flex items-center gap-2 text-xl font-bold"><Logo className="h-8 w-8" /> Campusly</span>
        <nav className="flex gap-2">
          <Link href="/sign-in" className="btn-secondary">Sign in</Link>
          <Link href={start.href} className="btn-primary hidden sm:inline-flex">{demoMode() ? "Try the demo" : "Get started"}</Link>
        </nav>
      </header>
      <section className="grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div>
          <p className="badge bg-accent-soft text-accent">School management for every role</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">One record for every student, shared by the whole school.</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">Admins, teachers, parents and students see the same, correct attendance, marks and fees, each seeing only what they should.</p>
          <Link href={start.href} className="btn-primary mt-8 min-h-12 px-6 text-base">{start.label}</Link>
        </div>
        <div className="panel p-6" aria-hidden="true">
          <p className="text-sm text-panel-muted">Today</p>
          <p className="mt-1 text-xl font-bold">2 of 3 classes marked</p>
          <div className="mt-3 h-2 rounded-full bg-panel-2"><div className="h-full w-2/3 rounded-full bg-cta" /></div>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[["12", "students"], ["88%", "attendance"], ["$1,700", "collected"]].map(([n, l]) => (
              <div key={l} className="rounded-control bg-surface p-3 text-text"><p className="text-lg font-bold">{n}</p><p className="text-xs text-muted">{l}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(([icon, title, body]) => (
          <div key={title} className="card p-5">
            <span className="icon-chip"><Icon name={icon} /></span>
            <h2 className="mt-4 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
