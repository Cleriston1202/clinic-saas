import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots } from "@/lib/clinic/availability";
import { resolveClinicBySlug } from "@/lib/clinic/resolveClinicBySlug";

export async function GET(request: NextRequest) {
  const clinicSlug = request.nextUrl.searchParams.get("clinicSlug") ?? "";
  const professionalId = request.nextUrl.searchParams.get("professionalId") ?? "";
  const serviceId = request.nextUrl.searchParams.get("serviceId") ?? "";
  const date = request.nextUrl.searchParams.get("date") ?? "";

  if (!clinicSlug || !professionalId || !serviceId || !date) {
    return NextResponse.json({ error: "Parametros obrigatorios ausentes." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  let clinic;
  try {
    clinic = await resolveClinicBySlug(supabase, clinicSlug);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar clinica." }, { status: 400 });
  }

  if (!clinic) {
    return NextResponse.json({ error: "Clinica nao encontrada." }, { status: 404 });
  }

  const [{ data: service, error: serviceError }, { data: professional, error: professionalError }] = await Promise.all([
    supabase
      .from("services")
      .select("id,duration_minutes")
      .eq("clinic_id", clinic.id)
      .eq("id", serviceId)
      .maybeSingle<{ id: string; duration_minutes: number }>(),
    supabase.from("doctors").select("id").eq("clinic_id", clinic.id).eq("id", professionalId).maybeSingle<{ id: string }>(),
  ]);

  if (serviceError || professionalError) {
    return NextResponse.json({ error: serviceError?.message ?? professionalError?.message ?? "Falha ao buscar disponibilidade." }, { status: 400 });
  }

  if (!service || !professional) {
    return NextResponse.json({ error: "Servico ou profissional invalido para esta clinica." }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(clinic.id, professional.id, date, service.duration_minutes);
    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao calcular horarios." }, { status: 400 });
  }
}
