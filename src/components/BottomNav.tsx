"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/library", label: "Library" },
  { href: "/recipes/new/manual", label: "Add" },
  { href: "/cook", label: "Cook" },
  { href: "/shopping-list", label: "Shopping" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex border-t bg-background pb-[env(safe-area-inset-bottom)]">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 py-3 text-center text-sm ${active ? "font-semibold" : "opacity-60"}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
