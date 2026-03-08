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
    .select("*, patient:patients(id,name,phone), doctor:doctors(id,name,specialty)")
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
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      clinic_id: profile.clinic_id,
      patient_id: body.patient_id,
      doctor_id: body.doctor_id,
      start_time: body.start_time,
      end_time: body.end_time,
      notes: body.notes ?? null,
      status: "scheduled",
    })
    .select("*, patient:patients(id,name,phone), doctor:doctors(id,name,specialty)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
