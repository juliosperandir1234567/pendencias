"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function useAtivo(href: string) {
  const pathname = usePathname();
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Aba do menu de cima (telas pequenas). */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const active = useAtivo(href);

  return (
    <Link
      href={href}
      className={`whitespace-nowrap border-b-2 px-2.5 py-2 text-xs font-medium transition sm:text-sm ${
        active
          ? "border-white text-white"
          : "border-transparent text-emerald-50/80 hover:border-brand-verde-claro hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

/** Item do menu lateral (telas grandes). */
export function SideLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const active = useAtivo(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-white/15 text-white"
          : "text-emerald-50/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {children}
    </Link>
  );
}
