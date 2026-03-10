"use client";

interface PatientFormProps {
  name: string;
  phone: string;
  email: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
}

export default function PatientForm({ name, phone, email, onNameChange, onPhoneChange, onEmailChange }: PatientFormProps) {
  return (
    <div className="grid gap-3">
      <label className="grid gap-1.5 text-sm text-slate-700">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nome completo</span>
        <input
          className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 shadow-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
      </label>
      <label className="grid gap-1.5 text-sm text-slate-700">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefone</span>
        <input
          className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 shadow-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          required
        />
      </label>
      <label className="grid gap-1.5 text-sm text-slate-700">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email (opcional)</span>
        <input
          type="email"
          className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 shadow-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
      </label>
    </div>
  );
}
