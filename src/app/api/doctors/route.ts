import { NextRequest, NextResponse } from "next/server";
import { getUserAndClinic } from "@/app/api/_utils";

export async function GET(request: NextRequest) {
  const context = await getUserAndClinic(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { data, error } = await context.supabase
    .from("doctors")
    .select("*")
    .order("created_at", { ascending: false });

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
    .from("doctors")
    .insert({
      clinic_id: profile.clinic_id,
      name: body.name,
      specialty: body.specialty,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
