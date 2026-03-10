import Link from "next/link";

interface BookingConfirmationProps {
  clinicName: string;
  appointmentId: string;
  message?: string;
}

export default function BookingConfirmation({ clinicName, appointmentId, message }: BookingConfirmationProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-10">
      <section className="surface-card w-full rounded-2xl p-6">
        <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Agendamento confirmado
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Sua consulta foi agendada.</h1>
        <p className="mt-2 text-sm text-slate-600">Clinica: {clinicName}</p>
        <p className="mt-1 text-sm text-slate-600">Codigo: {appointmentId}</p>
        {message ? <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}

        <div className="mt-6 flex gap-2">
          <Link href="/" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Voltar para inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
