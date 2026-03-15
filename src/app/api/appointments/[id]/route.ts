import { NextRequest, NextResponse } from "next/server";
import { getUserAndClinic } from "@/app/api/_utils";

interface Params {
  params: { id: string };
}

const VALID_STATUS = new Set(["scheduled", "confirmed", "completed", "canceled"]);

function mapAppointmentUpdateError(message: string, requestedStatus?: unknown) {
  if (message.includes("invalid input value for enum appointment_status")) {
    if (requestedStatus === "completed") {
      return {
        status: 409,
        error: "O banco ainda nao aceita o status 'completed'. Aplique a migration 20260314_fix_appointment_status_completed.sql no Supabase antes de concluir consultas.",
      };
    }

    if (requestedStatus === "canceled") {
      return {
        status: 409,
        error: "O banco ainda nao aceita o status 'canceled'. Verifique se a migration de padronizacao do enum appointment_status foi aplicada.",
      };
    }

    return {
      status: 409,
      error: "O enum appointment_status do banco esta desatualizado em relacao ao aplicativo. Aplique as migrations pendentes do Supabase.",
    };
  }

  return {
    status: 400,
    error: message,
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const context = await getUserAndClinic(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  if (!context.profile.clinic_id) {
    return NextResponse.json({ error: "Clinic profile not initialized." }, { status: 400 });
  }

  const body = await request.json();
  const payload: Record<string, unknown> = {};

  if (body.start_time) payload.start_time = body.start_time;
  if (body.end_time) payload.end_time = body.end_time;
  if (body.status) {
    if (!VALID_STATUS.has(body.status)) {
      return NextResponse.json({ error: "Status de consulta invalido." }, { status: 400 });
    }
    payload.status = body.status;
  }
  if (body.professional_id) {
    payload.professional_id = body.professional_id;
    payload.doctor_id = body.professional_id;
  }
  if (body.service_id !== undefined) payload.service_id = body.service_id;
  if (body.appointment_type) payload.appointment_type = body.appointment_type;
  if (body.notes !== undefined) payload.notes = body.notes;

  const { data: currentAppointment, error: currentAppointmentError } = await context.supabase
    .from("appointments")
    .select("id, clinic_id, service_id, status, service:services(id,name,price,duration_minutes)")
    .eq("id", params.id)
    .eq("clinic_id", context.profile.clinic_id)
    .maybeSingle();

  if (currentAppointmentError) {
    return NextResponse.json({ error: currentAppointmentError.message }, { status: 400 });
  }

  if (!currentAppointment) {
    return NextResponse.json({ error: "Consulta nao encontrada para esta clinica." }, { status: 404 });
  }

  const { data, error } = await context.supabase
    .from("appointments")
    .update(payload)
    .eq("id", params.id)
    .eq("clinic_id", context.profile.clinic_id)
    .select("*, patient:patients(id,name,phone), doctor:doctors!appointments_professional_id_fkey(id,name,specialty), service:services(id,name,price,duration_minutes)")
    .single();

  if (error) {
    const mappedError = mapAppointmentUpdateError(error.message, body.status);
    return NextResponse.json({ error: mappedError.error }, { status: mappedError.status });
  }

  if (body.status === "completed") {
    const paymentTimestamp = new Date().toISOString();
    const servicePrice = Number(data.service?.price ?? currentAppointment.service?.price ?? 0);

    const { data: existingPayment, error: existingPaymentError } = await context.supabase
      .from("payments")
      .select("id, status, amount, created_at")
      .eq("appointment_id", params.id)
      .eq("clinic_id", context.profile.clinic_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPaymentError) {
      return NextResponse.json({ error: existingPaymentError.message }, { status: 400 });
    }

    if (existingPayment) {
      const shouldRefreshPaidAt = existingPayment.status !== "paid";
      const paymentPayload: Record<string, unknown> = {
        amount: servicePrice > 0 ? servicePrice : Number(existingPayment.amount ?? 0),
        status: "paid",
      };

      if (shouldRefreshPaidAt) {
        paymentPayload.created_at = paymentTimestamp;
      }

      const { error: paymentUpdateError } = await context.supabase
        .from("payments")
        .update(paymentPayload)
        .eq("id", existingPayment.id)
        .eq("clinic_id", context.profile.clinic_id);

      if (paymentUpdateError) {
        return NextResponse.json({ error: paymentUpdateError.message }, { status: 400 });
      }
    } else {
      const { error: paymentInsertError } = await context.supabase
        .from("payments")
        .insert({
          clinic_id: context.profile.clinic_id,
          appointment_id: params.id,
          amount: servicePrice,
          status: "paid",
          created_at: paymentTimestamp,
        });

      if (paymentInsertError) {
        return NextResponse.json({ error: paymentInsertError.message }, { status: 400 });
      }
    }
  }

  return NextResponse.json(data);
}
