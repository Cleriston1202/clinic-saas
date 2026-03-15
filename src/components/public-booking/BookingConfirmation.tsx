import Link from "next/link";

interface BookingConfirmationProps {
  clinicName: string;
  clinicSlug?: string;
  appointmentId: string;
  message?: string;
}

export default function BookingConfirmation({ clinicName, clinicSlug, appointmentId, message }: BookingConfirmationProps) {
  const newBookingHref = clinicSlug ? `/agendar/${encodeURIComponent(clinicSlug)}` : "/";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
      <section className="surface-card w-full rounded-2xl p-6 sm:p-8">
        <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Agendamento confirmado
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Tudo certo, seu horario foi reservado.</h1>
        <p className="mt-2 text-sm text-slate-600">Clinica: {clinicName}</p>
        <p className="mt-1 text-sm text-slate-600">Codigo do agendamento: {appointmentId}</p>
        {message ? <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}

        <div className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          Se precisar marcar outro horario para voce ou outra pessoa, use o botao abaixo.
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a href={newBookingHref} className="brand-button rounded-md px-4 py-2 text-sm font-semibold text-white">
            Fazer novo agendamento
          </a>
          <Link href="/" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Voltar para inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
