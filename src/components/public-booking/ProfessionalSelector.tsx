"use client";

import { Doctor } from "@/types/database";

interface ProfessionalSelectorProps {
  professionals: Doctor[];
  value: string;
  onChange: (value: string) => void;
}

export default function ProfessionalSelector({ professionals, value, onChange }: ProfessionalSelectorProps) {
  return (
    <label className="grid gap-2 text-sm text-slate-700">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dentista</span>
      <select
        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 shadow-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="">Selecione um dentista</option>
        {professionals.map((professional) => (
          <option key={professional.id} value={professional.id}>
            {professional.name} - {professional.specialty}
          </option>
        ))}
      </select>
    </label>
  );
}
