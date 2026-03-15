"use client";

import { Service } from "@/types/database";

interface ServiceSelectorProps {
  services: Service[];
  value: string;
  onChange: (value: string) => void;
}

export default function ServiceSelector({ services, value, onChange }: ServiceSelectorProps) {
  const formatPrice = (price: number) => {
    return `R$ ${Number(price).toFixed(2)}`;
  };

  return (
    <label className="grid gap-2 text-sm text-slate-700">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Servico</span>
      <select
        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 shadow-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="">Selecione um servico</option>
        {services.map((service) => (
          <option key={service.id} value={service.id}>
            {service.name} | Valor: {formatPrice(service.price)} | Tempo: {service.duration_minutes} min
          </option>
        ))}
      </select>
      <span className="text-xs text-slate-500">Cada opcao mostra claramente o valor cobrado e o tempo do atendimento.</span>
    </label>
  );
}
