import { NextRequest, NextResponse } from "next/server";
import { getUserAndClinic } from "@/app/api/_utils";

export async function GET(request: NextRequest) {
  const context = await getUserAndClinic(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { supabase } = context;
  const search = request.nextUrl.searchParams.get("search");

  let query = supabase.from("patients").select("*").order("created_at", { ascending: false });
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

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

  const { supabase, profile } = context;
  if (!profile?.clinic_id) {
    return NextResponse.json({ error: "Clinic profile not initialized." }, { status: 400 });
  }

  const body = await request.json();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      clinic_id: profile.clinic_id,
      name: body.name,
      phone: body.phone ?? null,
      email: body.email ?? null,
      birth_date: body.birth_date ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
