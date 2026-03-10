"use client";

import { Doctor } from "@/types/database";

interface ProfessionalSelectorProps {
  professionals: Doctor[];
  value: string;
  onChange: (value: string) => void;
}

export default function ProfessionalSelector({ professionals, value, onChange }: ProfessionalSelectorProps) {
  return (
    <label className="grid gap-1 text-sm text-slate-700">
      Dentista
      <select className="rounded-md border border-slate-300 bg-white px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} required>
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
