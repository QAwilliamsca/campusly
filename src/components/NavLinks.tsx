"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

type NavLink = { label: string; href: string; icon: IconName };

/** Loading state for navigation: the clicked item shows a bar until the next page is ready. */
function Pending() {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" className={`absolute inset-y-2 right-0 w-1 rounded-full bg-cta ${pending ? "animate-pulse" : "hidden"}`} />;
}

const isActive = (href: string, path: string) => href === path || (href.split("/").length > 3 && path.startsWith(href));

/** Sidebar on wide screens (D-019). */
export function SideNav({ links }: { links: NavLink[] }) {
  const path = usePathname();
  return (
    <nav aria-label="School">
      <ul className="space-y-1">
        {links.map((l) => {
          const active = isActive(l.href, path);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-11 items-center gap-3 rounded-control px-3 text-sm ${active ? "bg-accent-soft font-semibold text-accent shadow-[inset_-3px_0_0_var(--cta)]" : "text-muted hover:bg-surface-2 hover:text-text"}`}
              >
                <Icon name={l.icon} />
                {l.label}
                <Pending />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The same links as scrollable pills on phones and tablets. */
export function NavLinks({ links }: { links: NavLink[] }) {
  const path = usePathname();
  return (
    <nav aria-label="School (compact)" className="overflow-x-auto px-4 pt-3 sm:px-6">
      <ul className="flex gap-2">
        {links.map((l) => {
          const active = isActive(l.href, path);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                ref={active ? (el) => el?.scrollIntoView({ block: "nearest", inline: "center" }) : undefined}
                className={`inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-4 text-sm ${active ? "bg-panel font-semibold text-panel-fg" : "border border-border bg-surface text-muted hover:text-text"}`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
