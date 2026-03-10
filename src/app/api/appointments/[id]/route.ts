import { NextRequest, NextResponse } from "next/server";
import { getUserAndClinic } from "@/app/api/_utils";

interface Params {
  params: { id: string };
}

const VALID_STATUS = new Set(["scheduled", "confirmed", "completed", "canceled"]);

export async function PATCH(request: NextRequest, { params }: Params) {
  const context = await getUserAndClinic(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
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

  const { data, error } = await context.supabase
    .from("appointments")
    .update(payload)
    .eq("id", params.id)
    .select("*, patient:patients(id,name,phone), doctor:doctors!appointments_professional_id_fkey(id,name,specialty), service:services(id,name,price,duration_minutes)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
