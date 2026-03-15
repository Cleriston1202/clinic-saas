"use client";

import { ReactNode, useEffect, useMemo, useState, useTransition } from "react";
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

  const selectedService = services.find((item) => item.id === serviceId);
  const selectedProfessional = professionals.find((item) => item.id === professionalId);

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
        `/confirmacao-agendamento?clinic=${encodeURIComponent(clinic.name)}&clinicSlug=${encodeURIComponent(clinic.slug)}&appointment=${encodeURIComponent(result.appointmentId ?? "")}&message=${encodeURIComponent(result.message)}`,
      );
    });
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-8 sm:px-6 sm:py-10">
      <section className="mb-5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-cyan-50 to-sky-50 p-5 sm:p-6">
        <p className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Agendamento online
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">{clinic.name}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">Escolha servico, dentista e horario em poucos passos. Sem login, simples e rapido.</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="surface-card rounded-2xl p-4 sm:p-6">
          {setupMessage ? (
            <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{setupMessage}</p>
          ) : null}

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Step title="1. Escolha o servico">
              <ServiceSelector services={services} value={serviceId} onChange={setServiceId} />
            </Step>

            <Step title="2. Escolha o dentista">
              <ProfessionalSelector professionals={professionals} value={professionalId} onChange={setProfessionalId} />
            </Step>

            <Step title="3. Selecione a data">
              <CalendarSelector value={date} onChange={setDate} />
            </Step>

            <Step title="4. Escolha o horario">
              <TimeSlotSelector slots={slots} value={slotStart} onChange={setSlotStart} loading={slotsLoading} />
            </Step>

            <Step title="5. Dados do paciente">
              <PatientForm
                name={patientName}
                phone={patientPhone}
                email={patientEmail}
                onNameChange={setPatientName}
                onPhoneChange={setPatientPhone}
                onEmailChange={setPatientEmail}
              />
            </Step>

            {error ? <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p> : null}
            {submitHint ? <p className="text-sm text-slate-600">{submitHint}</p> : null}

            <button
              type="submit"
              disabled={isPending || !canSubmit}
              className="brand-button rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? "Confirmando..." : "Confirmar agendamento"}
            </button>
          </form>
        </section>

        <aside className="surface-card h-fit rounded-2xl p-4 sm:p-5 lg:sticky lg:top-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Resumo</h2>
          <div className="mt-3 space-y-3 text-sm">
            <SummaryItem label="Clinica" value={clinic.name} />
            <SummaryItem
              label="Servico"
              value={
                selectedService
                  ? `${selectedService.name} | Valor: R$ ${Number(selectedService.price).toFixed(2)} | Tempo: ${selectedService.duration_minutes} min`
                  : "Nao selecionado"
              }
            />
            <SummaryItem label="Dentista" value={selectedProfessional ? selectedProfessional.name : "Nao selecionado"} />
            <SummaryItem label="Data" value={date || "Nao selecionada"} />
            <SummaryItem label="Horario" value={slotStart ? new Date(slotStart).toLocaleString("pt-BR") : "Nao selecionado"} />
          </div>

          <div className="mt-4 rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-600">
            O agendamento sera confirmado somente em horario livre. Em caso de conflito, voce podera escolher outro horario.
          </div>
        </aside>
      </div>
    </main>
  );
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-800">{title}</h3>
      {children}
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  );
}
