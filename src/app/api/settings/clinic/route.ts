import { NextRequest, NextResponse } from "next/server";
import { getUserAndClinic } from "@/app/api/_utils";

export async function GET(request: NextRequest) {
  const context = await getUserAndClinic(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { profile, supabase } = context;
  if (!profile?.clinic_id) {
    return NextResponse.json({ clinic: null });
  }

  const { data, error } = await supabase.from("clinics").select("*").eq("id", profile.clinic_id).single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ clinic: data });
}

export async function POST(request: NextRequest) {
  const context = await getUserAndClinic(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { user, supabase, profile } = context;
  const body = await request.json();

  if (profile?.clinic_id) {
    return NextResponse.json({ error: "Clinic already initialized." }, { status: 400 });
  }

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .insert({ name: body.name, plan: body.plan ?? "starter" })
    .select("*")
    .single();

  if (clinicError) {
    return NextResponse.json({ error: clinicError.message }, { status: 400 });
  }

  const { error: userError } = await supabase.from("users").upsert(
    {
      id: user.id,
      clinic_id: clinic.id,
      email: user.email ?? body.email,
      role: "admin",
    },
    { onConflict: "id" },
  );

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 400 });
  }

  return NextResponse.json({ clinic }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
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
    .from("clinics")
    .update({ name: body.name, plan: body.plan })
    .eq("id", profile.clinic_id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ clinic: data });
}
