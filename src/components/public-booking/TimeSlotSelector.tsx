"use client";

import { AvailableSlot } from "@/lib/clinic/availability";

interface TimeSlotSelectorProps {
  slots: AvailableSlot[];
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
}

export default function TimeSlotSelector({ slots, value, onChange, loading }: TimeSlotSelectorProps) {
  if (loading) {
    return <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">Carregando horarios disponiveis...</p>;
  }

  if (slots.length === 0) {
    return <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">Sem horarios livres para os filtros selecionados.</p>;
  }

  return (
    <div className="grid gap-2 text-sm text-slate-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Horario</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slots.map((slot) => (
          <button
            key={slot.startIso}
            type="button"
            onClick={() => onChange(slot.startIso)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              value === slot.startIso
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            {slot.label}
          </button>
        ))}
      </div>
    </div>
  );
}
