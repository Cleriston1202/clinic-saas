"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Service } from "@/types/database";

const parseError = (raw: string) => {
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    return parsed.error ?? raw;
  } catch {
    return raw;
  }
};

interface ClinicPayload {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { accessToken, loading } = useSupabaseSession();
  const [clinic, setClinic] = useState<ClinicPayload | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("starter");
  const [message, setMessage] = useState("");
  const [origin, setOrigin] = useState("");

  const [services, setServices] = useState<Service[]>([]);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("0");
  const [serviceDuration, setServiceDuration] = useState("30");
  const [servicesMessage, setServicesMessage] = useState("");

  const loadClinic = useCallback(async (token: string) => {
    const response = await fetch("/api/settings/clinic", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(parseError(await response.text()));

    const data = await response.json();
    if (data.clinic) {
      setClinic(data.clinic);
      setName(data.clinic.name);
      setSlug(data.clinic.slug ?? "");
      setPlan(data.clinic.plan);
    }
  }, []);

  const loadServices = useCallback(async (token: string) => {
    const response = await fetch("/api/services", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(parseError(await response.text()));
    }

    const data = (await response.json()) as Service[];
    setServices(data);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      router.push("/login");
      return;
    }

    Promise.all([loadClinic(accessToken), loadServices(accessToken)])
      .catch((error: unknown) => {
        const next = error instanceof Error ? error.message : "Falha ao carregar configuracoes da clinica.";
        setMessage(next);
        if (next.includes("Clinic profile not initialized")) {
          router.push("/settings");
        }
      });
  }, [accessToken, loading, loadClinic, loadServices, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;

    const response = await fetch("/api/settings/clinic", {
      method: clinic ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name, plan, slug }),
    });

    if (!response.ok) {
      setMessage(parseError(await response.text()));
      return;
    }

    setMessage("Salvo com sucesso.");
    await loadClinic(accessToken);
  };

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setServiceName("");
    setServicePrice("0");
    setServiceDuration("30");
  };

  const handleServiceSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;

    const isEditing = Boolean(editingServiceId);
    const endpoint = isEditing ? `/api/services/${editingServiceId}` : "/api/services";

    const response = await fetch(endpoint, {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: serviceName,
        price: Number(servicePrice),
        duration_minutes: Number(serviceDuration),
      }),
    });

    if (!response.ok) {
      setServicesMessage(parseError(await response.text()));
      return;
    }

    setServicesMessage(isEditing ? "Servico atualizado com sucesso." : "Servico criado com sucesso.");
    resetServiceForm();
    await loadServices(accessToken);
  };

  const publicUrl = clinic?.slug ? `${origin}/agendar/${clinic.slug}` : "";

  return (
    <main className="mx-auto max-w-5xl px-6 py-6">
      <AppNav />
      <h1 className="mb-4 text-2xl font-semibold">Configurações</h1>

      <section className="mb-4 grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <h2 className="text-sm font-semibold text-emerald-900">Link público de agendamento</h2>
        <p className="text-sm text-emerald-800">Compartilhe este link com seus pacientes para agendamento sem login.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={publicUrl || "Salve o perfil da clinica para gerar a URL"}
            className="w-full rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm text-slate-800"
          />
          <button
            type="button"
            disabled={!publicUrl}
            onClick={async () => {
              if (!publicUrl) return;
              await navigator.clipboard.writeText(publicUrl);
              setMessage("URL publica copiada.");
            }}
            className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Copiar URL
          </button>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Perfil da clínica</h2>
        <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Nome da clínica" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Slug da clínica (ex: dental-clean)" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="starter">Iniciante</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Empresarial</option>
        </select>
        <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">Salvar configurações</button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </form>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <form onSubmit={handleServiceSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold">{editingServiceId ? "Editar serviço" : "Criar serviço"}</h2>
          <p className="text-xs text-slate-500">Preencha separadamente quanto cobrar (valor) e quanto tempo leva (duração).</p>

          <label className="grid gap-1 text-sm text-slate-700">
            <span className="font-medium">Nome do serviço</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ex: Limpeza completa"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              required
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm text-slate-700">
              <span className="font-medium">Valor do serviço (R$)</span>
              <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2">
                <span className="mr-2 text-sm text-slate-500">R$</span>
                <input
                  className="w-full border-0 p-0 text-sm focus:outline-none"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  required
                />
              </div>
              <span className="text-xs text-slate-500">Quanto o paciente vai pagar.</span>
            </label>

            <label className="grid gap-1 text-sm text-slate-700">
              <span className="font-medium">Tempo do serviço (minutos)</span>
              <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2">
                <input
                  className="w-full border-0 p-0 text-sm focus:outline-none"
                  type="number"
                  min="5"
                  step="5"
                  placeholder="30"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                  required
                />
                <span className="ml-2 text-sm text-slate-500">min</span>
              </div>
              <span className="text-xs text-slate-500">Tempo médio ocupado na agenda.</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
              {editingServiceId ? "Salvar alterações" : "Adicionar serviço"}
            </button>
            {editingServiceId ? (
              <button
                type="button"
                onClick={resetServiceForm}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            ) : null}
          </div>
          {servicesMessage ? <p className="text-sm text-slate-600">{servicesMessage}</p> : null}
        </form>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">Serviços cadastrados</h2>
          {services.length === 0 ? <p className="text-sm text-slate-500">Nenhum serviço cadastrado ainda.</p> : null}
          <div className="space-y-2">
            {services.map((service) => (
              <div key={service.id} className="rounded-md border border-slate-200 px-3 py-2">
                <p className="text-sm font-medium text-slate-900">{service.name}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">Valor: R$ {Number(service.price).toFixed(2)}</span>
                  <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-800">Tempo: {service.duration_minutes} min</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingServiceId(service.id);
                    setServiceName(service.name);
                    setServicePrice(String(service.price));
                    setServiceDuration(String(service.duration_minutes));
                    setServicesMessage("");
                  }}
                  className="mt-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
