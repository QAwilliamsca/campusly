import Link from "next/link";
import { Logo } from "./Logo";

/** Split layout for sign-in, sign-up, password and invite pages (D-019). The form side owns the page's <h1>. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section className="panel m-4 hidden flex-col justify-between p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold"><Logo className="h-8 w-8" /> Campusly</Link>
        <div>
          <p className="text-4xl font-bold leading-tight">One record for every student, shared by the whole school.</p>
          <p className="mt-4 max-w-md text-panel-muted">Admins, teachers, parents and students see the same attendance, marks and fees, each only what they should.</p>
        </div>
        <ul className="grid grid-cols-3 gap-3 text-sm">
          {["Students & classes", "Attendance", "Exams & fees"].map((f) => <li key={f} className="rounded-control bg-panel-2 px-3 py-2 text-center font-semibold">{f}</li>)}
        </ul>
      </section>
      <main className="flex flex-col items-center justify-center gap-6 px-4 py-10 sm:pr-16">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold lg:hidden"><Logo /> Campusly</Link>
        {children}
      </main>
    </div>
  );
}
