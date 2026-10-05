"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session/session-context";

const LINKS = [
  { href: "/feed", label: "Feed" },
  { href: "/jobs", label: "Jobs" },
  { href: "/events", label: "Events" },
  { href: "/profile", label: "Profile" },
  { href: "/status", label: "Live status" },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const { user } = useSession();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <nav className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
        {LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={active ? "font-semibold" : "text-neutral-600 hover:text-neutral-900"}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
        {user && <span className="ml-auto text-neutral-500">{user.name}</span>}
      </nav>
    </header>
  );
}
