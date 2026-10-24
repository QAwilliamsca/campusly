import Link from "next/link";
import { Logo } from "@/components/Logo";

const FEATURES = [
  ["Students & classes", "Admissions with automatic student codes, class lists and teacher assignment."],
  ["Attendance", "Teachers mark a class in under a minute. Parents see it the same day."],
  ["Exams & report cards", "Enter marks once; report cards calculate themselves."],
  ["Fees", "Bill a whole class, record payments, see what's due at a glance."],
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <Logo /> Campusly
        </span>
        <nav className="flex gap-2">
          <Link href="/sign-in" className="btn-secondary">Sign in</Link>
          <Link href="/sign-up" className="btn-primary">Get started</Link>
        </nav>
      </header>
      <section className="py-16 sm:py-24">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">One record for every student, shared by the whole school.</h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Admins, teachers, parents and students see the same, correct attendance, marks and fees, each seeing only what they should.
        </p>
        <Link href="/sign-up" className="btn-primary mt-8">Create your school</Link>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(([title, body]) => (
          <div key={title} className="card p-5">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
