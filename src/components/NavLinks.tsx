"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

/** Loading state for navigation: the clicked tab shows a bar until the next page is ready. */
function Pending() {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" className={`absolute inset-x-3 bottom-0 h-0.5 bg-accent ${pending ? "animate-pulse" : "hidden"}`} />;
}

export function NavLinks({ links }: { links: { label: string; href: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="School" className="mx-auto max-w-6xl overflow-x-auto px-2 sm:px-4">
      <ul className="flex gap-1">
        {links.map((l) => {
          const active = l.href === path || (l.href.split("/").length > 3 && path.startsWith(l.href));
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                ref={active ? (el) => el?.scrollIntoView({ block: "nearest", inline: "center" }) : undefined}
                className={`relative inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm ${active ? "border-accent font-medium text-text" : "border-transparent text-muted hover:text-text"}`}
              >
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
