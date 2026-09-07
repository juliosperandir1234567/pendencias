"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

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
