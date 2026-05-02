"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_LINKS = [
  { href: "/library", label: "Library" },
  { href: "/equipment", label: "Kitchen" },
];

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleSignOut() {
    signOut({ callbackUrl: "/login" });
  }

  function handleImport() {
    router.push("/import");
  }

  return (
    <header
      className="sticky top-0 z-10 flex h-[52px] items-center border-b-[0.5px] border-border bg-paper px-5 md:px-7"
    >
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        <span className="font-display text-[17px] font-medium italic text-ink">
          CookbookAI
        </span>
      </Link>

      {/* Desktop nav */}
      <nav
        aria-label="Primary"
        className="ml-6 hidden items-center gap-1 md:flex"
      >
        <ul role="list" className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-sm px-[10px] py-[5px] font-ui text-ui transition-colors hover:text-ink ${
                    isActive
                      ? "font-medium text-ink"
                      : "text-ink-muted"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Desktop: sign out */}
      <button
        onClick={handleSignOut}
        className="mr-4 hidden font-ui text-ui-sm text-ink-muted hover:text-ink md:block"
      >
        Sign out
      </button>

      {/* Import button — visible at all breakpoints */}
      <button
        onClick={handleImport}
        className="h-[30px] rounded-sm bg-accent px-3 font-ui text-ui text-paper transition-colors hover:bg-accent-strong"
      >
        + Import
      </button>
    </header>
  );
}
