"use client";

import { FormEvent, useMemo, useState } from "react";
import { Doctor, Patient } from "@/types/database";

interface AppointmentFormProps {
  patients: Patient[];
  doctors: Doctor[];
  onCreate: (payload: {
    patient_id: string;
    doctor_id: string;
    start_time: string;
    end_time: string;
    notes: string;
  }) => Promise<void>;
}

export default function AppointmentForm({ patients, doctors, onCreate }: AppointmentFormProps) {
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => patientId && doctorId && startTime && endTime, [patientId, doctorId, startTime, endTime]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      await onCreate({ patient_id: patientId, doctor_id: doctorId, start_time: startTime, end_time: endTime, notes });
      setPatientId("");
      setDoctorId("");
      setStartTime("");
      setEndTime("");
      setNotes("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Criar consulta</h2>
      <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
        <option value="">Selecione o paciente</option>
        {patients.map((patient) => (
          <option key={patient.id} value={patient.id}>
            {patient.name}
          </option>
        ))}
      </select>
      <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
        <option value="">Selecione o médico</option>
        {doctors.map((doctor) => (
          <option key={doctor.id} value={doctor.id}>
            {doctor.name} - {doctor.specialty}
          </option>
        ))}
      </select>
      <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
      <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
      <textarea className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      <button disabled={loading || !canSubmit} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
        {loading ? "Criando..." : "Criar consulta"}
      </button>
    </form>
  );
}
