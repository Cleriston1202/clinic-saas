import { NextRequest, NextResponse } from "next/server";
import { getUserAndClinic } from "@/app/api/_utils";

export async function GET(request: NextRequest) {
  const context = await getUserAndClinic(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { data, error } = await context.supabase.from("services").select("*").order("created_at", { ascending: false });

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
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const price = Number(body?.price ?? 0);
  const durationMinutes = Number(body?.duration_minutes ?? 30);

  if (!name) {
    return NextResponse.json({ error: "Nome do servico e obrigatorio." }, { status: 400 });
  }

  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Preco do servico invalido." }, { status: 400 });
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return NextResponse.json({ error: "Duracao do servico invalida." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("services")
    .insert({
      clinic_id: profile.clinic_id,
      name,
      price,
      duration_minutes: durationMinutes,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
