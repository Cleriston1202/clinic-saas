"use client";

import { Service } from "@/types/database";

interface ServiceSelectorProps {
  services: Service[];
  value: string;
  onChange: (value: string) => void;
}

export default function ServiceSelector({ services, value, onChange }: ServiceSelectorProps) {
  return (
    <label className="grid gap-1 text-sm text-slate-700">
      Servico
      <select className="rounded-md border border-slate-300 bg-white px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="">Selecione um servico</option>
        {services.map((service) => (
          <option key={service.id} value={service.id}>
            {service.name} - {service.duration_minutes} min
          </option>
        ))}
      </select>
    </label>
  );
}
