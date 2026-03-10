"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clinic, Doctor, Service } from "@/types/database";
import { AvailableSlot } from "@/lib/clinic/availability";
import ServiceSelector from "@/components/public-booking/ServiceSelector";
import ProfessionalSelector from "@/components/public-booking/ProfessionalSelector";
import CalendarSelector from "@/components/public-booking/CalendarSelector";
import TimeSlotSelector from "@/components/public-booking/TimeSlotSelector";
import PatientForm from "@/components/public-booking/PatientForm";

interface CreatePublicResult {
  ok: boolean;
  message: string;
  appointmentId?: string;
}

interface PublicBookingFlowProps {
  clinic: Pick<Clinic, "name" | "slug">;
  services: Service[];
  professionals: Doctor[];
  createAction: (formData: FormData) => Promise<CreatePublicResult>;
}

export default function PublicBookingFlow({ clinic, services, professionals, createAction }: PublicBookingFlowProps) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!serviceId && services.length === 1) {
      setServiceId(services[0].id);
    }
  }, [serviceId, services]);

  useEffect(() => {
    if (!professionalId && professionals.length === 1) {
      setProfessionalId(professionals[0].id);
    }
  }, [professionalId, professionals]);

  useEffect(() => {
    setSlotStart("");
    if (!serviceId || !professionalId || !date) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);

    fetch(`/api/public/availability?clinicSlug=${encodeURIComponent(clinic.slug)}&professionalId=${encodeURIComponent(professionalId)}&serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          const raw = await response.text();
          try {
            const parsed = JSON.parse(raw) as { error?: string };
            throw new Error(parsed.error ?? raw);
          } catch {
            throw new Error(raw);
          }
        }
        return response.json() as Promise<{ slots: AvailableSlot[] }>;
      })
      .then((payload) => {
        if (!cancelled) {
          setSlots(payload.slots);
          setError("");
        }
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Falha ao carregar horarios.");
          setSlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSlotsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clinic.slug, date, professionalId, serviceId]);

  const canSubmit = useMemo(
    () => Boolean(services.length > 0 && professionals.length > 0 && serviceId && professionalId && date && slotStart && patientName.trim() && patientPhone.trim()),
    [serviceId, professionalId, date, slotStart, patientName, patientPhone, professionals.length, services.length],
  );

  const setupMessage = useMemo(() => {
    const missing: string[] = [];
    if (services.length === 0) missing.push("servicos");
    if (professionals.length === 0) missing.push("dentistas");
    if (missing.length === 0) return "";

    return `Esta clinica ainda nao configurou ${missing.join(" e ")} para agendamento publico.`;
  }, [professionals.length, services.length]);

  const submitHint = useMemo(() => {
    if (setupMessage) return "Agendamento indisponivel ate a clinica concluir o cadastro inicial.";
    if (!serviceId) return "Selecione um servico.";
    if (!professionalId) return "Selecione um dentista.";
    if (!date) return "Selecione uma data.";
    if (!slotStart) return "Escolha um horario disponivel.";
    if (!patientName.trim()) return "Informe seu nome.";
    if (!patientPhone.trim()) return "Informe seu telefone.";
    return "";
  }, [setupMessage, serviceId, professionalId, date, slotStart, patientName, patientPhone]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      setError("Preencha os campos obrigatorios e escolha um horario livre.");
      return;
    }

    const formData = new FormData();
    formData.set("clinicSlug", clinic.slug);
    formData.set("serviceId", serviceId);
    formData.set("professionalId", professionalId);
    formData.set("date", date);
    formData.set("slotStart", slotStart);
    formData.set("patientName", patientName.trim());
    formData.set("patientPhone", patientPhone.trim());
    formData.set("patientEmail", patientEmail.trim());

    startTransition(async () => {
      const result = await createAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setError("");
      router.push(
        `/confirmacao-agendamento?clinic=${encodeURIComponent(clinic.name)}&appointment=${encodeURIComponent(result.appointmentId ?? "")}&message=${encodeURIComponent(result.message)}`,
      );
    });
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <section className="surface-card rounded-2xl p-6">
        <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Agendamento online
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{clinic.name}</h1>
        <p className="mt-2 text-sm text-slate-600">Escolha seu servico, dentista e horario para concluir o agendamento.</p>

        {setupMessage ? (
          <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{setupMessage}</p>
        ) : null}

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <ServiceSelector services={services} value={serviceId} onChange={setServiceId} />
          <ProfessionalSelector professionals={professionals} value={professionalId} onChange={setProfessionalId} />
          <CalendarSelector value={date} onChange={setDate} />
          <TimeSlotSelector slots={slots} value={slotStart} onChange={setSlotStart} loading={slotsLoading} />
          <PatientForm
            name={patientName}
            phone={patientPhone}
            email={patientEmail}
            onNameChange={setPatientName}
            onPhoneChange={setPatientPhone}
            onEmailChange={setPatientEmail}
          />

          {error ? <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p> : null}
          {submitHint ? <p className="text-sm text-slate-600">{submitHint}</p> : null}

          <button
            type="submit"
            disabled={isPending || !canSubmit}
            className="brand-button rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Confirmando..." : "Confirmar agendamento"}
          </button>
        </form>
      </section>
    </main>
  );
}
