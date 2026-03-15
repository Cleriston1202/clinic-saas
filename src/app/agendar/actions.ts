"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots } from "@/lib/clinic/availability";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { resolveClinicBySlug } from "@/lib/clinic/resolveClinicBySlug";

interface CreatePublicAppointmentResult {
  ok: boolean;
  message: string;
  appointmentId?: string;
}

export async function createPublicAppointment(formData: FormData): Promise<CreatePublicAppointmentResult> {
  const clinicSlug = String(formData.get("clinicSlug") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const professionalId = String(formData.get("professionalId") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const slotStart = String(formData.get("slotStart") ?? "").trim();
  const patientName = String(formData.get("patientName") ?? "").trim();
  const rawPatientPhone = String(formData.get("patientPhone") ?? "").trim();
  const patientPhone = rawPatientPhone.replace(/\D+/g, "");
  const patientEmail = String(formData.get("patientEmail") ?? "").trim().toLowerCase();

  if (!clinicSlug || !serviceId || !professionalId || !date || !slotStart || !patientName || !patientPhone) {
    return { ok: false, message: "Preencha todos os campos obrigatorios para concluir o agendamento." };
  }

  if (patientPhone.length < 10) {
    return { ok: false, message: "Telefone invalido. Informe DDD e numero." };
  }

  if (patientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)) {
    return { ok: false, message: "Email invalido." };
  }

  const supabase = createSupabaseAdminClient();

  let clinic;
  try {
    clinic = await resolveClinicBySlug(supabase, clinicSlug);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Falha ao carregar clinica." };
  }

  if (!clinic) return { ok: false, message: "Clinica nao encontrada." };

  const [{ data: service, error: serviceError }, { data: professional, error: professionalError }] = await Promise.all([
    supabase
      .from("services")
      .select("id,name,duration_minutes")
      .eq("clinic_id", clinic.id)
      .eq("id", serviceId)
      .maybeSingle<{ id: string; name: string; duration_minutes: number }>(),
    supabase
      .from("doctors")
      .select("id,name")
      .eq("clinic_id", clinic.id)
      .eq("id", professionalId)
      .maybeSingle<{ id: string; name: string }>(),
  ]);

  if (serviceError || professionalError) {
    return { ok: false, message: serviceError?.message ?? professionalError?.message ?? "Falha ao validar dados." };
  }

  if (!service || !professional) {
    return { ok: false, message: "Servico ou profissional nao encontrado para esta clinica." };
  }

  const slots = await getAvailableSlots(clinic.id, professional.id, date, service.duration_minutes);
  const chosenSlot = slots.find((item) => item.startIso === slotStart);
  if (!chosenSlot) {
    return { ok: false, message: "Horario indisponivel. Escolha outro horario." };
  }

  let patientId: string | null = null;
  let patientRecord: { id: string; name: string; phone: string | null; email: string | null } | null = null;

  let existingByEmail: { id: string; name: string; phone: string | null; email: string | null } | null = null;
  if (patientEmail) {
    const { data } = await supabase
      .from("patients")
      .select("id,name,phone,email")
      .eq("clinic_id", clinic.id)
      .ilike("email", patientEmail)
      .maybeSingle<{ id: string; name: string; phone: string | null; email: string | null }>();
    existingByEmail = data ?? null;
  }

  const { data: existingByPhone } = await supabase
    .from("patients")
    .select("id,name,phone,email")
    .eq("clinic_id", clinic.id)
    .eq("phone", patientPhone)
    .maybeSingle<{ id: string; name: string; phone: string | null; email: string | null }>();

  if (existingByEmail && existingByPhone && existingByEmail.id !== existingByPhone.id) {
    return { ok: false, message: "Ja existe conflito entre email e telefone em cadastros diferentes. Contate a clinica." };
  }

  patientRecord = existingByEmail ?? existingByPhone ?? null;
  patientId = patientRecord?.id ?? null;

  if (!patientId) {
    const { data: createdPatient, error: patientError } = await supabase
      .from("patients")
      .insert({
        clinic_id: clinic.id,
        name: patientName,
        phone: patientPhone,
        email: patientEmail || null,
      })
      .select("id,name,phone,email")
      .single<{ id: string; name: string; phone: string | null; email: string | null }>();

    if (patientError || !createdPatient) {
      return { ok: false, message: patientError?.message ?? "Falha ao criar paciente." };
    }

    patientId = createdPatient.id;
    patientRecord = createdPatient;
  } else if (patientRecord) {
    const nextName = patientName;
    const nextPhone = patientPhone;
    const nextEmail = patientEmail || patientRecord.email;

    const shouldUpdate = patientRecord.name !== nextName || (patientRecord.phone ?? "") !== nextPhone || (patientRecord.email ?? "") !== (nextEmail ?? "");

    if (shouldUpdate) {
      const { error: updatePatientError } = await supabase
        .from("patients")
        .update({
          name: nextName,
          phone: nextPhone,
          email: nextEmail,
        })
        .eq("id", patientId)
        .eq("clinic_id", clinic.id);

      if (updatePatientError) {
        return { ok: false, message: updatePatientError.message };
      }
    }
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      clinic_id: clinic.id,
      patient_id: patientId,
      professional_id: professional.id,
      doctor_id: professional.id,
      service_id: service.id,
      appointment_type: "public-booking",
      start_time: chosenSlot.startIso,
      end_time: chosenSlot.endIso,
      status: "scheduled",
      notes: "Agendamento publico",
    })
    .select("id")
    .single<{ id: string }>();

  if (appointmentError || !appointment) {
    return { ok: false, message: appointmentError?.message ?? "Falha ao criar consulta." };
  }

  // Optional best-effort WhatsApp confirmation.
  if (patientPhone) {
    await sendWhatsAppMessage({
      to: patientPhone,
      message: `Oi ${patientName}, sua consulta na ${clinic.name} foi agendada para ${new Date(chosenSlot.startIso).toLocaleString("pt-BR")}.`,
    });
  }

  return {
    ok: true,
    message: "Agendamento realizado com sucesso.",
    appointmentId: appointment.id,
  };
}
