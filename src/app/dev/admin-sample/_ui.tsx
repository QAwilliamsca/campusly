import { notFound } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./admin-sample.css";

/*
 * Shared shell for the redesign samples under /dev/admin-sample (local only, like /dev/brand).
 * Static demo data from Maple Grove (scripts/seed.ts); nothing here talks to the database.
 */
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], variable: "--f-jakarta" });
const BASE = "/dev/admin-sample";

export const PALETTES = [
  { id: "ocean", label: "Your palette" },
  { id: "evergreen", label: "Evergreen (current app)" },
  { id: "reference", label: "Reference (salmon)" },
];
export type SP = { searchParams: Promise<{ palette?: string }> };

export async function palette({ searchParams }: SP) {
  if (process.env.NODE_ENV === "production") notFound();
  const { palette: p } = await searchParams;
  return PALETTES.some((x) => x.id === p) ? p! : "ocean";
}

type Nav = { label: string; href: string; icon: string };
export const STAFF_NAV: Nav[] = [
  { label: "Dashboard", href: "", icon: "grid" },
  { label: "Students", href: "/students", icon: "users" },
  { label: "Classes", href: "/classes", icon: "layers" },
  { label: "Attendance", href: "/attendance", icon: "check" },
  { label: "Exams", href: "/exams", icon: "doc" },
  { label: "Fees", href: "/fees", icon: "cash" },
  { label: "Members", href: "/members", icon: "user" },
  { label: "Audit log", href: "/audit", icon: "list" },
];
export const TEACHER_NAV: Nav[] = [
  { label: "Dashboard", href: "/teacher", icon: "grid" },
  { label: "Students", href: "/students", icon: "users" },
  { label: "Attendance", href: "/attendance", icon: "check" },
  { label: "Exams", href: "/exams", icon: "doc" },
];
export const PARENT_NAV: Nav[] = [{ label: "My children", href: "/parent", icon: "users" }];
const OTHER_VIEWS: Nav[] = [
  { label: "Teacher view", href: "/teacher", icon: "user" },
  { label: "Parent view", href: "/parent", icon: "users" },
  { label: "Sign-in page", href: "/sign-in", icon: "out" },
];

export const link = (pal: string, href: string) => `${BASE}${href}?palette=${pal}`;

export function Shell(props: {
  pal: string; title: string; subtitle?: string; active: string; nav?: Nav[];
  user?: { name: string; role: string; initials: string }; actions?: React.ReactNode; children: React.ReactNode;
}) {
  const { pal, nav = STAFF_NAV, user = { name: "Priya Natarajan", role: "Owner", initials: "PN" } } = props;
  return (
    <div className={`${jakarta.variable} acero pal-${pal} flex min-h-dvh`}>
      <nav aria-label="Main" className="a-side hidden w-60 shrink-0 flex-col p-5 lg:flex">
        <a href={link(pal, "")} className="flex items-center gap-2 px-2 text-xl font-bold"><Icon name="cap" /> Campusly</a>
        <ul className="mt-8 space-y-1">
          {nav.map((n) => <NavItem key={n.label} pal={pal} n={n} active={props.active === n.label} />)}
        </ul>
        <p className="a-muted mt-8 px-3 text-xs font-semibold uppercase tracking-wider">Other sample views</p>
        <ul className="mt-2 space-y-1">
          {OTHER_VIEWS.map((n) => <NavItem key={n.label} pal={pal} n={n} active={props.active === n.label} />)}
        </ul>
        <ul className="mt-auto space-y-1 pt-6">
          {nav === STAFF_NAV && <NavItem pal={pal} n={{ label: "Settings", href: "/settings", icon: "gear" }} active={props.active === "Settings"} />}
          <NavItem pal={pal} n={{ label: "Sign out", href: "/sign-in", icon: "out" }} active={false} />
        </ul>
      </nav>
      <div className="min-w-0 flex-1">
        {/* pr-16 keeps clear of the fixed sun/moon toggle (D-014). */}
        <header className="flex flex-wrap items-center gap-4 border-b border-[var(--a-border)] py-4 pl-4 pr-16 sm:pl-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{props.title}</h1>
            <p className="a-muted text-sm">{props.subtitle ?? "Maple Grove School"}</p>
          </div>
          <label className="a-search ml-auto hidden min-w-64 items-center gap-2 px-4 py-2.5 text-sm md:flex">
            <Icon name="search" />
            <input aria-label="Search students" placeholder="Search students" className="w-full bg-transparent outline-none placeholder:text-[var(--a-muted)]" />
          </label>
          <span className="a-icon-soft hidden h-10 w-10 place-items-center sm:grid"><Icon name="bell" /></span>
          <span className="flex items-center gap-3">
            <Avatar initials={user.initials} />
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold">{user.name}</span>
              <span className="a-muted block text-xs">{user.role}</span>
            </span>
          </span>
        </header>
        <nav aria-label="Main (small screens)" className="flex gap-2 overflow-x-auto px-4 pt-4 lg:hidden">
          {[...nav, ...OTHER_VIEWS].map((n) => (
            <a key={n.label} href={link(pal, n.href)} aria-current={props.active === n.label ? "page" : undefined} className="a-nav shrink-0 px-3 py-1.5 text-sm">{n.label}</a>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 text-sm sm:px-6">
          <span className="a-muted">Colours:</span>
          {PALETTES.map((p) => (
            <a key={p.id} href={`?palette=${p.id}`} aria-current={p.id === pal ? "true" : undefined} className="a-switch a-btn-ghost px-3 py-1.5 font-semibold">{p.label}</a>
          ))}
          {props.actions && <span className="ml-auto flex flex-wrap gap-2">{props.actions}</span>}
        </div>
        <main className="p-4 sm:p-6">{props.children}</main>
      </div>
    </div>
  );
}

function NavItem({ pal, n, active }: { pal: string; n: Nav; active: boolean }) {
  return (
    <li>
      <a href={link(pal, n.href)} aria-current={active ? "page" : undefined} className="a-nav flex items-center gap-3 px-3 py-2.5 text-sm">
        <Icon name={n.icon} /> {n.label}
      </a>
    </li>
  );
}

/** Standalone wrapper (no sidebar) for pages like sign-in. */
export function Bare({ pal, children }: { pal: string; children: React.ReactNode }) {
  return <div className={`${jakarta.variable} acero pal-${pal} min-h-dvh`}>{children}</div>;
}

export function Card({ title, action, className = "", children }: { title?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={`a-card p-5 ${className}`}>
      {title && <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}
export function Kpi({ label, value, icon, strong, note }: { label: string; value: string; icon: string; strong?: boolean; note?: string }) {
  return (
    <div className="a-card flex items-center justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="a-muted text-sm">{label}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {note && <p className="a-muted mt-1 text-xs">{note}</p>}
      </div>
      <span className={`${strong ? "a-icon" : "a-icon-soft"} grid h-11 w-11 shrink-0 place-items-center`}><Icon name={icon} /></span>
    </div>
  );
}
export function Stat({ label, value }: { label: string; value: string }) {
  return <div className="a-tile p-3 text-center"><p className="text-lg font-bold">{value}</p><p className="a-muted text-xs">{label}</p></div>;
}
export function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  const cls = tone === "paid" ? "a-paid" : tone === "due" ? "a-due" : tone === "over" ? "a-over" : "a-icon-soft";
  return <span className={`a-pill ${cls}`}>{children}</span>;
}
export function Avatar({ initials, size = "h-10 w-10 text-sm" }: { initials: string; size?: string }) {
  return <span className={`a-icon grid shrink-0 place-items-center font-bold ${size}`}>{initials}</span>;
}
export function Btn({ children, ghost }: { children: React.ReactNode; ghost?: boolean }) {
  return <button type="button" className={`${ghost ? "a-btn-ghost" : "a-btn"} px-4 py-2 text-sm`}>{children}</button>;
}
export function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input defaultValue={value} className="a-search w-full px-3 py-2.5 text-[var(--a-text)] outline-none" />
      {hint && <span className="a-muted mt-1 block text-xs">{hint}</span>}
    </label>
  );
}
export function Table({ head, children, min = 560 }: { head: string[]; children: React.ReactNode; min?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth: min }}>
        <thead className="a-muted"><tr>{head.map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export const initialsOf = (name: string) => name.split(" ").map((w) => [...w][0]).join("").slice(0, 2).toUpperCase();

const PATHS: Record<string, string> = {
  cap: "M22 10 12 5 2 10l10 5 10-5ZM6 12v5c3 2 9 2 12 0v-5",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  users: "M16 20v-2a4 4 0 0 0-8 0v2M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 20v-2a3 3 0 0 0-2-2.8M4 20v-2a3 3 0 0 1 2-2.8",
  layers: "m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5",
  check: "M9 11l3 3 8-8M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9",
  doc: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6ZM14 3v6h6M8 13h8M8 17h5",
  cash: "M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  out: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  dots: "M5 12h.01M12 12h.01M19 12h.01",
  plus: "M12 5v14M5 12h14",
  file: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6ZM14 3v6h6",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
};
export function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
