import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SignOut } from "@/components/SignOut";
import { NavLinks } from "@/components/NavLinks";
import { Badge } from "@/components/ui";
import { isStaff } from "@/lib/can";
import { requireCtx } from "@/lib/session";

export default async function SchoolLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireCtx(slug);
  const base = `/s/${slug}`;
  const links = isStaff(ctx.member)
    ? [["Dashboard", ""], ["Students", "/students"], ["Classes", "/classes"], ["Attendance", "/attendance"], ["Exams", "/exams"], ["Fees", "/fees"], ["Members", "/members"], ["Audit log", "/audit"], ["Settings", "/settings"]]
    : ctx.member.role === "teacher"
      ? [["Dashboard", ""], ["Students", "/students"], ["Attendance", "/attendance"], ["Exams", "/exams"]]
      : [["Dashboard", ""]];

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href={base} className="flex min-w-0 items-center gap-2 font-semibold">
            <Logo />
            <span className="truncate">{ctx.school.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted sm:inline">{ctx.user.name}</span>
            <Badge tone="info">{ctx.member.role}</Badge>
            <Link href="/schools" className="btn-secondary hidden sm:inline-flex">Switch</Link>
            <SignOut />
          </div>
        </div>
        <NavLinks links={links.map(([label, path]) => ({ label: label!, href: base + path }))} />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
