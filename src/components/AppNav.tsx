"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { buildAccessTokenCookie } from "@/lib/auth/cookies";

const links = [
  { href: "/dashboard", label: "Painel" },
  { href: "/patients", label: "Pacientes" },
  { href: "/doctors", label: "Médicos" },
  { href: "/appointments", label: "Consultas" },
  { href: "/settings", label: "Configurações" },
];

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase } = useSupabaseSession();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = buildAccessTokenCookie(null);
    router.push("/login");
  };

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-md px-3 py-2 text-sm ${pathname === link.href ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
        >
          {link.label}
        </Link>
      ))}
      <button className="ml-auto rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700" onClick={handleLogout}>
        Sair
      </button>
    </nav>
  );
}
