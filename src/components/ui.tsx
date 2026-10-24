import Link from "next/link";

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/** Empty states teach the next step (PLAYBOOK §18.6). */
export function Empty({ title, hint, action }: { title: string; hint?: string; action?: { href: string; label: string } }) {
  return (
    <div className="rounded-card border border-dashed border-border px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      {action && (
        <Link href={action.href} className="btn-secondary mt-4">
          {action.label}
        </Link>
      )}
    </div>
  );
}

const TONES = {
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-2 text-muted",
  info: "bg-accent-soft text-accent",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={`badge ${TONES[tone]}`}>{children}</span>;
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card p-5 ${className}`}>
      {title && <h2 className="mb-3 text-base font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

/** Wraps wide tables so only the table scrolls — never the page (375px rule). */
export function TableWrap({ children }: { children: React.ReactNode }) {
  // `relative` matters: sr-only labels are position:absolute and would otherwise escape the scroll box.
  return <div className="relative -mx-5 overflow-x-auto px-5">{children}</div>;
}

export const pct = (n: number | null) => (n === null ? "—" : `${n}%`);
