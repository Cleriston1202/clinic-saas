"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import AppointmentForm from "@/components/AppointmentForm";
import Calendar from "@/components/Calendar";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { appointmentService } from "@/services/appointmentService";
import { Doctor, Patient, Appointment, Service } from "@/types/database";

const parseError = (raw: string) => {
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    return parsed.error ?? raw;
  } catch {
    return raw;
  }
};

export default function AppointmentsPage() {
  const router = useRouter();
  const { accessToken, loading } = useSupabaseSession();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [message, setMessage] = useState("");

  const loadAll = useCallback(async (token: string) => {
    try {
      const [patientsRes, doctorsRes, servicesRes, appointmentsRes] = await Promise.all([
        fetch("/api/patients", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch("/api/doctors", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch("/api/services", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        appointmentService.list(token),
      ]);

      if (!patientsRes.ok) throw new Error(parseError(await patientsRes.text()));
      if (!doctorsRes.ok) throw new Error(parseError(await doctorsRes.text()));
      if (!servicesRes.ok) throw new Error(parseError(await servicesRes.text()));

      setPatients(await patientsRes.json());
      setDoctors(await doctorsRes.json());
      setServices(await servicesRes.json());
      setAppointments(appointmentsRes);
      setMessage("");
    } catch (error) {
      const next = error instanceof Error ? error.message : "Falha ao carregar consultas.";
      setMessage(next);
      if (next.includes("Clinic profile not initialized")) {
        router.push("/settings");
      }
    }
  }, [router]);

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      router.push("/login");
      return;
    }

    loadAll(accessToken);
  }, [accessToken, loading, loadAll, router]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <AppNav />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Consultas</h1>
        <button
          type="button"
          onClick={() => setShowCreateForm((current) => !current)}
          className="rounded-md border border-teal-700 bg-teal-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          {showCreateForm ? "Fechar nova consulta" : "Nova consulta"}
        </button>
      </div>
      {message ? <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p> : null}

      {showCreateForm ? (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
          <AppointmentForm
            patients={patients}
            doctors={doctors}
            services={services}
            onCreate={async (payload) => {
              if (!accessToken) {
                const next = "Sessao expirada. Faca login novamente.";
                setMessage(next);
                throw new Error(next);
              }
              try {
                await appointmentService.create(accessToken, payload);
                await loadAll(accessToken);
                setMessage("");
                setShowCreateForm(false);
              } catch (error) {
                const next = error instanceof Error ? parseError(error.message) : "Falha ao criar consulta.";
                setMessage(next);
                throw new Error(next);
              }
            }}
          />
        </div>
      ) : null}

      <Calendar
        appointments={appointments}
        doctors={doctors}
        onMove={async (appointmentId, start, end) => {
          if (!accessToken) {
            setMessage("Sessao expirada. Faca login novamente.");
            return;
          }

          try {
            await appointmentService.update(accessToken, appointmentId, {
              start_time: start.toISOString(),
              end_time: end.toISOString(),
            });
            await loadAll(accessToken);
            setMessage("Horario da consulta atualizado.");
          } catch (error) {
            const next = error instanceof Error ? parseError(error.message) : "Falha ao atualizar consulta.";
            setMessage(next);
            throw new Error(next);
          }
        }}
        onStatusChange={async (appointmentId, status) => {
          if (!accessToken) {
            setMessage("Sessao expirada. Faca login novamente.");
            return;
          }

          try {
            await appointmentService.update(accessToken, appointmentId, { status });
            await loadAll(accessToken);
            setMessage("Status da consulta atualizado.");
          } catch (error) {
            const next = error instanceof Error ? parseError(error.message) : "Falha ao atualizar status da consulta.";
            setMessage(next);
            throw new Error(next);
          }
        }}
        onError={(message) => setMessage(parseError(message))}
      />
    </main>
  );
}
