import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-10">
      <section className="surface-card grid gap-8 rounded-2xl p-7 md:grid-cols-[1.1fr_0.9fr] md:p-10">
        <div>
          <p className="mb-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Plataforma para clinicas
          </p>
          <h1 className="text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
            Agenda inteligente para uma rotina clinica sem atrito
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
            Centralize pacientes, consultas, profissionais e faturamento em uma interface leve e objetiva.
            Feita para operacao diaria, com foco em velocidade de atendimento.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/login" className="brand-button rounded-md px-5 py-2.5 text-sm font-semibold text-white">
              Entrar no painel
            </Link>
            <Link href="/register" className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Criar minha clinica
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Feature title="Agenda visual" text="Visao por dia e semana com arraste e ajuste rapido." />
          <Feature title="Pacientes" text="Cadastro enxuto com busca instantanea por nome, email e telefone." />
          <Feature title="Equipe" text="Gestao de dentistas e profissionais por clinica." />
          <Feature title="Resultados" text="Metricas de operacao e receita com leitura imediata." />
        </div>
      </section>
      <div className="mt-6 px-1 text-xs text-slate-500">Clinica SaaS · Next.js + Supabase + TypeScript</div>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{text}</p>
    </article>
  );
}
