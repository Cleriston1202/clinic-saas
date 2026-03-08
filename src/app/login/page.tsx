"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

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
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form onSubmit={handleSubmit} className="w-full space-y-3 rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <input className="w-full rounded-md border border-slate-300 px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-md border border-slate-300 px-3 py-2" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button disabled={loading} className="w-full rounded-md bg-slate-900 px-3 py-2 text-white disabled:opacity-60">
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="text-sm text-slate-600">
          Não tem conta? <Link href="/register" className="text-slate-900 underline">Cadastre-se</Link>
        </p>
      </form>
    </main>
  );
}
