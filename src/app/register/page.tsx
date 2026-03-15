"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { buildAccessTokenCookie } from "@/lib/auth/cookies";

export default function RegisterPage() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      document.cookie = buildAccessTokenCookie(session.access_token);
      const clinicResponse = await fetch("/api/settings/clinic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: clinicName, plan: "starter", email }),
      });

      if (!clinicResponse.ok) {
        setLoading(false);
        setError("Conta criada, mas nao foi possivel inicializar a clinica. Acesse Configuracoes e tente novamente.");
        return;
      }
    } else {
      setLoading(false);
      setError("Conta criada, mas sem sessao ativa. Faca login e finalize em Configuracoes.");
      return;
    }

    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 sm:px-6">
      <form onSubmit={handleSubmit} className="surface-card w-full space-y-3 rounded-2xl p-6">
        <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700">Primeiro acesso</p>
        <h1 className="text-3xl font-bold">Cadastrar Clinica</h1>
        <p className="text-sm text-slate-600">Crie sua conta de administrador e inicie a configuracao da clinica.</p>
        <input className="w-full rounded-md border border-slate-300 bg-white px-3 py-2" placeholder="Nome da clinica" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required />
        <input className="w-full rounded-md border border-slate-300 bg-white px-3 py-2" type="email" placeholder="Email do administrador" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-md border border-slate-300 bg-white px-3 py-2" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button disabled={loading} className="brand-button w-full rounded-md px-3 py-2 text-white disabled:opacity-60">
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
        <p className="text-sm text-slate-600">
          Já tem conta? <Link href="/login" className="text-slate-900 underline">Entrar</Link>
        </p>
      </form>
    </main>
  );
}
