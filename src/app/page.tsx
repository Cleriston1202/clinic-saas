import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
        SaaS de Agendamento para Clínicas
      </h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        Plataforma multi-tenant para clínicas com gestão de calendário, prontuário de pacientes,
        alocação de médicos, pagamentos e lembretes por WhatsApp.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/login" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Entrar
        </Link>
        <Link href="/register" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          Cadastrar Clínica
        </Link>
      </div>
    </main>
  );
}
