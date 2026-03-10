"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { buildAccessTokenCookie } from "@/lib/auth/cookies";

const links = [
  { href: "/dashboard", label: "Painel" },
  { href: "/patients", label: "Pacientes" },
  { href: "/doctors", label: "Dentistas" },
  { href: "/appointments", label: "Consultas" },
  { href: "/settings", label: "Configurações" },
];

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase } = useSupabaseSession();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = buildAccessTokenCookie(null);
    router.push("/login");
  };

  return (
    <nav className="surface-card mb-6 rounded-xl p-3">
      <div className="flex items-center justify-between md:hidden">
        <p className="text-sm font-semibold text-slate-800">Menu</p>
        <button
          type="button"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
          className="rounded-md border border-slate-300 bg-white p-2 text-slate-700"
        >
          <span className="relative block h-4 w-5">
            <span className={`absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`absolute left-0 top-[7px] h-0.5 w-5 rounded bg-current transition ${menuOpen ? "opacity-0" : "opacity-100"}`} />
            <span className={`absolute left-0 top-[14px] h-0.5 w-5 rounded bg-current transition ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </span>
        </button>
      </div>

      <div className={`${menuOpen ? "mt-3 grid" : "hidden"} gap-2 md:hidden`}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-2 text-sm font-medium ${pathname === link.href ? "bg-emerald-700 text-white" : "bg-white text-slate-700 hover:bg-slate-100"}`}
          >
            {link.label}
          </Link>
        ))}
        <button
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          onClick={handleLogout}
        >
          Sair
        </button>
      </div>

      <div className="hidden flex-wrap items-center gap-2 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-2 text-sm font-medium ${pathname === link.href ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"}`}
          >
            {link.label}
          </Link>
        ))}
        <button className="ml-auto rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={handleLogout}>
          Sair
        </button>
      </div>
    </nav>
  );
}
