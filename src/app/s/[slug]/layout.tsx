import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SignOut } from "@/components/SignOut";
import { NavLinks, SideNav } from "@/components/NavLinks";
import { Icon, type IconName } from "@/components/Icon";
import { Badge, initials } from "@/components/ui";
import { isStaff } from "@/lib/can";
import { requireCtx } from "@/lib/session";

const STAFF: [string, string, IconName][] = [
  ["Dashboard", "", "grid"], ["Students", "/students", "users"], ["Classes", "/classes", "layers"], ["Attendance", "/attendance", "check"],
  ["Exams", "/exams", "doc"], ["Fees", "/fees", "cash"], ["Members", "/members", "user"], ["Audit log", "/audit", "list"], ["Settings", "/settings", "gear"],
];
const TEACHER: [string, string, IconName][] = [["Dashboard", "", "grid"], ["Students", "/students", "users"], ["Attendance", "/attendance", "check"], ["Exams", "/exams", "doc"]];
const FAMILY: [string, string, IconName][] = [["Dashboard", "", "grid"]];

/** App shell (D-019): sidebar on wide screens, pill tabs on small ones. Pages own the single <h1>. */
export default async function SchoolLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireCtx(slug);
  const base = `/s/${slug}`;
  const nav = isStaff(ctx.member) ? STAFF : ctx.member.role === "teacher" ? TEACHER : FAMILY;
  const links = nav.map(([label, path, icon]) => ({ label, href: base + path, icon }));

  return (
    <div className="flex min-h-dvh">
      {/* Outer column paints the sidebar full height; the inner one stays put while the page scrolls. */}
      <div className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
      <aside className="sticky top-0 flex h-dvh flex-col p-5">
        <Link href={base} className="flex items-center gap-2 px-2 text-xl font-bold"><Logo className="h-8 w-8" /> Campusly</Link>
        <div className="tile mt-6 p-3">
          <p className="text-xs text-muted">School</p>
          <p className="truncate font-semibold">{ctx.school.name}</p>
          <Link href="/schools" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-accent"><Icon name="swap" className="h-3.5 w-3.5" /> Switch school</Link>
        </div>
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto"><SideNav links={links} /></div>
        <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
          <span className="avatar h-10 w-10 text-sm">{initials(ctx.user.name)}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{ctx.user.name}</span>
            <span className="block text-xs capitalize text-muted">{ctx.member.role}</span>
          </span>
        </div>
      </aside>
      </div>
      <div className="min-w-0 flex-1">
        {/* pr-16 keeps clear of the fixed sun/moon toggle (D-014). */}
        <header className="flex items-center gap-3 border-b border-border bg-surface py-3 pl-4 pr-16 sm:pl-6">
          <Link href={base} className="flex min-w-0 items-center gap-2 font-semibold lg:hidden">
            <Logo />
            <span className="truncate">{ctx.school.name}</span>
          </Link>
          <span className="hidden min-w-0 truncate text-sm text-muted lg:block">{ctx.school.name} · {ctx.school.timezone}</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm font-medium sm:inline lg:hidden">{ctx.user.name}</span>
            <Badge tone="info">{ctx.member.role}</Badge>
            <Link href="/schools" className="btn-secondary hidden sm:inline-flex lg:hidden">Switch</Link>
            <SignOut />
          </div>
        </header>
        <div className="lg:hidden"><NavLinks links={links} /></div>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
