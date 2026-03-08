"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

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
      await fetch("/api/settings/clinic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: clinicName, plan: "starter", email }),
      });
    }

    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form onSubmit={handleSubmit} className="w-full space-y-3 rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Cadastrar Clínica</h1>
        <input className="w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Nome da clínica" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required />
        <input className="w-full rounded-md border border-slate-300 px-3 py-2" type="email" placeholder="Email do administrador" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-md border border-slate-300 px-3 py-2" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button disabled={loading} className="w-full rounded-md bg-slate-900 px-3 py-2 text-white disabled:opacity-60">
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
        <p className="text-sm text-slate-600">
          Já tem conta? <Link href="/login" className="text-slate-900 underline">Entrar</Link>
        </p>
      </form>
    </main>
  );
}
