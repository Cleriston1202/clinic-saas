"use client";

import { FormEvent, useEffect, useState } from "react";
import { Patient } from "@/types/database";

interface PatientFormProps {
  initialValue?: Partial<Patient>;
  onSubmit: (payload: { name: string; phone: string; email: string; birth_date: string }) => Promise<void>;
  submitLabel: string;
}

export default function PatientForm({ initialValue, onSubmit, submitLabel }: PatientFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initialValue?.name ?? "");
    setPhone(initialValue?.phone ?? "");
    setEmail(initialValue?.email ?? "");
    setBirthDate(initialValue?.birth_date ?? "");
  }, [initialValue]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ name, phone, email, birth_date: birthDate });
      if (!initialValue?.id) {
        setName("");
        setPhone("");
        setEmail("");
        setBirthDate("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Paciente</h2>
      <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      <button disabled={loading} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
        {loading ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
