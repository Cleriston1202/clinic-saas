"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { buildAccessTokenCookie } from "@/lib/auth/cookies";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    document.cookie = buildAccessTokenCookie(data.session?.access_token ?? null);
    router.push("/dashboard");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 sm:px-6">
      <form onSubmit={handleSubmit} className="surface-card w-full space-y-3 rounded-2xl p-6">
        <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">Acesso seguro</p>
        <h1 className="text-3xl font-bold">Entrar</h1>
        <p className="text-sm text-slate-600">Acesse o painel da sua clinica para gerenciar operacao e agenda.</p>
        <input className="w-full rounded-md border border-slate-300 bg-white px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-md border border-slate-300 bg-white px-3 py-2" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button disabled={loading} className="brand-button w-full rounded-md px-3 py-2 text-white disabled:opacity-60">
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="text-sm text-slate-600">
          Não tem conta? <Link href="/register" className="text-slate-900 underline">Cadastre-se</Link>
        </p>
      </form>
    </main>
  );
}
