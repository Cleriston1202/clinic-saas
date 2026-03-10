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
  const [startDate, setStartDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endHour, setEndHour] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => Boolean(patientId && doctorId && startDate && startHour && endDate && endHour),
    [patientId, doctorId, startDate, startHour, endDate, endHour],
  );

  const buildDateTime = (date: string, time: string) => {
    if (!date || !time) return null;
    const parsed = new Date(`${date}T${time}`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const formatFriendlyDateTime = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  const durationLabel = useMemo(() => {
    const parsedStart = buildDateTime(startDate, startHour);
    const parsedEnd = buildDateTime(endDate, endHour);
    if (!parsedStart || !parsedEnd || parsedEnd <= parsedStart) {
      return "";
    }

    const minutes = Math.floor((parsedEnd.getTime() - parsedStart.getTime()) / 60000);
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    if (hours > 0 && remaining > 0) {
      return `Duracao: ${hours}h ${remaining}min`;
    }

    if (hours > 0) {
      return `Duracao: ${hours}h`;
    }

    return `Duracao: ${remaining}min`;
  }, [startDate, startHour, endDate, endHour]);

  const scheduleSummary = useMemo(() => {
    const parsedStart = buildDateTime(startDate, startHour);
    const parsedEnd = buildDateTime(endDate, endHour);
    if (!parsedStart || !parsedEnd || parsedEnd <= parsedStart) {
      return "";
    }

    return `${formatFriendlyDateTime(parsedStart)} ate ${formatFriendlyDateTime(parsedEnd)}`;
  }, [startDate, startHour, endDate, endHour]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!patientId) {
      setFormError("Selecione um paciente.");
      return;
    }
    if (!doctorId) {
      setFormError("Selecione um medico.");
      return;
    }
    if (!startDate || !startHour || !endDate || !endHour) {
      setFormError("Preencha inicio e fim da consulta.");
      return;
    }

    const parsedStart = buildDateTime(startDate, startHour);
    const parsedEnd = buildDateTime(endDate, endHour);
    if (!parsedStart || !parsedEnd) {
      setFormError("Preencha data e hora validas para inicio e fim.");
      return;
    }

    if (parsedEnd <= parsedStart) {
      setFormError("A data final precisa ser maior que a data inicial.");
      return;
    }

    setLoading(true);
    setFormError("");
    try {
      await onCreate({
        patient_id: patientId,
        doctor_id: doctorId,
        start_time: parsedStart.toISOString(),
        end_time: parsedEnd.toISOString(),
        notes,
      });
      setPatientId("");
      setDoctorId("");
      setStartDate("");
      setStartHour("");
      setEndDate("");
      setEndHour("");
      setNotes("");
    } catch (error) {
      const next = error instanceof Error ? error.message : "Nao foi possivel criar a consulta.";
      setFormError(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Criar consulta</h2>
      <p className="text-xs text-slate-600">Escolha data e hora separadamente para facilitar o agendamento.</p>

      <label className="grid gap-1 text-sm text-slate-700">
        Paciente
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={patientId}
          onChange={(e) => {
            setPatientId(e.target.value);
            setFormError("");
          }}
          disabled={patients.length === 0}
          required
        >
        <option value="">Selecione o paciente</option>
        {patients.map((patient) => (
          <option key={patient.id} value={patient.id}>
            {patient.name}
          </option>
        ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm text-slate-700">
        Medico
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={doctorId}
          onChange={(e) => {
            setDoctorId(e.target.value);
            setFormError("");
          }}
          disabled={doctors.length === 0}
          required
        >
        <option value="">Selecione o médico</option>
        {doctors.map((doctor) => (
          <option key={doctor.id} value={doctor.id}>
            {doctor.name} - {doctor.specialty}
          </option>
        ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm text-slate-700">
        Inicio da consulta
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="date"
            value={startDate}
            onChange={(e) => {
              const nextDate = e.target.value;
              setStartDate(nextDate);
              if (!endDate) setEndDate(nextDate);
              setFormError("");
            }}
            required
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="time"
            value={startHour}
            step={300}
            onChange={(e) => {
              const nextHour = e.target.value;
              setStartHour(nextHour);
              if (!endHour) {
                const parsedStart = buildDateTime(startDate, nextHour);
                if (parsedStart) {
                  const suggestedEnd = new Date(parsedStart.getTime() + 30 * 60000);
                  setEndDate(suggestedEnd.toISOString().slice(0, 10));
                  setEndHour(suggestedEnd.toTimeString().slice(0, 5));
                }
              }
              setFormError("");
            }}
            required
          />
        </div>
      </label>

      <label className="grid gap-1 text-sm text-slate-700">
        Fim da consulta
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => {
              setEndDate(e.target.value);
              setFormError("");
            }}
            required
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="time"
            value={endHour}
            step={300}
            onChange={(e) => {
              setEndHour(e.target.value);
              setFormError("");
            }}
            required
          />
        </div>
      </label>

      <textarea
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        placeholder="Observacoes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />

      {formError ? <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{formError}</p> : null}

      {scheduleSummary ? <p className="text-xs text-slate-700">Agendado para: {scheduleSummary}</p> : null}

      {patients.length === 0 || doctors.length === 0 ? (
        <p className="text-xs text-slate-600">Para criar consulta, cadastre pelo menos 1 paciente e 1 medico.</p>
      ) : null}

      {durationLabel ? <p className="text-xs font-medium text-slate-700">{durationLabel}</p> : null}

      {!canSubmit ? <p className="text-xs text-slate-500">Preencha todos os campos obrigatorios para habilitar o envio.</p> : null}

      <button type="submit" disabled={loading} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
        {loading ? "Criando..." : "Criar consulta"}
      </button>
    </form>
  );
}
