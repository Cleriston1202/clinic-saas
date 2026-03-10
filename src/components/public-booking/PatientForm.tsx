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
      <label className="grid gap-1 text-sm text-slate-700">
        Nome completo
        <input className="rounded-md border border-slate-300 bg-white px-3 py-2" value={name} onChange={(e) => onNameChange(e.target.value)} required />
      </label>
      <label className="grid gap-1 text-sm text-slate-700">
        Telefone
        <input className="rounded-md border border-slate-300 bg-white px-3 py-2" value={phone} onChange={(e) => onPhoneChange(e.target.value)} required />
      </label>
      <label className="grid gap-1 text-sm text-slate-700">
        Email (opcional)
        <input type="email" className="rounded-md border border-slate-300 bg-white px-3 py-2" value={email} onChange={(e) => onEmailChange(e.target.value)} />
      </label>
    </div>
  );
}
