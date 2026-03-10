import { NextRequest, NextResponse } from "next/server";
import { getUserAndClinic } from "@/app/api/_utils";

export async function GET(request: NextRequest) {
  const context = await getUserAndClinic(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  let query = context.supabase
    .from("appointments")
    .select("*, patient:patients(id,name,phone), doctor:doctors!appointments_professional_id_fkey(id,name,specialty), service:services(id,name,price,duration_minutes)")
    .order("start_time", { ascending: true });

  if (from) query = query.gte("start_time", from);
  if (to) query = query.lte("end_time", to);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const context = await getUserAndClinic(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { profile, supabase } = context;
  if (!profile?.clinic_id) {
    return NextResponse.json({ error: "Clinic profile not initialized." }, { status: 400 });
  }

  const body = await request.json();
  const patientId = typeof body?.patient_id === "string" ? body.patient_id : "";
  const professionalId = typeof body?.professional_id === "string"
    ? body.professional_id
    : typeof body?.doctor_id === "string"
      ? body.doctor_id
      : "";
  const serviceId = typeof body?.service_id === "string" ? body.service_id : null;
  const appointmentType = typeof body?.appointment_type === "string" ? body.appointment_type : "general";
  const startTime = typeof body?.start_time === "string" ? body.start_time : "";
  const endTime = typeof body?.end_time === "string" ? body.end_time : "";

  if (!patientId || !professionalId || !startTime || !endTime) {
    return NextResponse.json({ error: "Preencha paciente, profissional, inicio e fim da consulta." }, { status: 400 });
  }

  const parsedStart = new Date(startTime);
  const parsedEnd = new Date(endTime);
  if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
    return NextResponse.json({ error: "Data/hora invalida para a consulta." }, { status: 400 });
  }

  if (parsedEnd <= parsedStart) {
    return NextResponse.json({ error: "A data final precisa ser maior que a data inicial." }, { status: 400 });
  }

  const [{ data: patient, error: patientError }, { data: doctor, error: doctorError }] = await Promise.all([
    supabase.from("patients").select("id").eq("id", patientId).eq("clinic_id", profile.clinic_id).maybeSingle(),
    supabase.from("doctors").select("id").eq("id", professionalId).eq("clinic_id", profile.clinic_id).maybeSingle(),
  ]);

  if (patientError || doctorError) {
    return NextResponse.json({ error: patientError?.message ?? doctorError?.message ?? "Falha ao validar dados da consulta." }, { status: 400 });
  }

  if (!patient) {
    return NextResponse.json({ error: "Paciente invalido para esta clinica." }, { status: 400 });
  }

  if (!doctor) {
    return NextResponse.json({ error: "Profissional invalido para esta clinica." }, { status: 400 });
  }

  if (serviceId) {
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id")
      .eq("id", serviceId)
      .eq("clinic_id", profile.clinic_id)
      .maybeSingle();

    if (serviceError) {
      return NextResponse.json({ error: serviceError.message }, { status: 400 });
    }

    if (!service) {
      return NextResponse.json({ error: "Servico invalido para esta clinica." }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      clinic_id: profile.clinic_id,
      patient_id: patientId,
      professional_id: professionalId,
      doctor_id: professionalId,
      service_id: serviceId,
      appointment_type: appointmentType,
      start_time: parsedStart.toISOString(),
      end_time: parsedEnd.toISOString(),
      notes: body.notes ?? null,
      status: "scheduled",
    })
    .select("*, patient:patients(id,name,phone), doctor:doctors!appointments_professional_id_fkey(id,name,specialty), service:services(id,name,price,duration_minutes)")
    .single();

  if (error) {
    if (error.message.includes("appointment_time_check")) {
      return NextResponse.json({ error: "A data final precisa ser maior que a data inicial." }, { status: 400 });
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
