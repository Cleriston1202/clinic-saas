"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import AppointmentForm from "@/components/AppointmentForm";
import Calendar from "@/components/Calendar";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { appointmentService } from "@/services/appointmentService";
import { Doctor, Patient, Appointment } from "@/types/database";

export default function AppointmentsPage() {
  const router = useRouter();
  const { accessToken, loading } = useSupabaseSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const loadAll = async (token: string) => {
    const [patientsRes, doctorsRes, appointmentsRes] = await Promise.all([
      fetch("/api/patients", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
      fetch("/api/doctors", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
      appointmentService.list(token),
    ]);

    if (!patientsRes.ok) throw new Error(await patientsRes.text());
    if (!doctorsRes.ok) throw new Error(await doctorsRes.text());

    setPatients(await patientsRes.json());
    setDoctors(await doctorsRes.json());
    setAppointments(appointmentsRes);
  };

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      router.push("/login");
      return;
    }

    loadAll(accessToken).catch(console.error);
  }, [accessToken, loading, router]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      <AppNav />
      <h1 className="mb-4 text-2xl font-semibold">Consultas</h1>

      <div className="mb-4">
        <AppointmentForm
          patients={patients}
          doctors={doctors}
          onCreate={async (payload) => {
            if (!accessToken) return;
            await appointmentService.create(accessToken, payload);
            await loadAll(accessToken);
          }}
        />
      </div>

      <Calendar
        appointments={appointments}
        doctors={doctors}
        onMove={async (appointmentId, start, end) => {
          if (!accessToken) return;
          await appointmentService.update(accessToken, appointmentId, {
            start_time: start.toISOString(),
            end_time: end.toISOString(),
          });
          await loadAll(accessToken);
        }}
        onCancel={async (appointmentId) => {
          if (!accessToken) return;
          await appointmentService.update(accessToken, appointmentId, { status: "cancelled" });
          await loadAll(accessToken);
        }}
      />
    </main>
  );
}
