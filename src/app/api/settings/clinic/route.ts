import { NextRequest, NextResponse } from "next/server";
import { getUserAndClinic } from "@/app/api/_utils";
import { createSupabaseServiceClient } from "@/lib/supabase";

function hasPrivilegedServiceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return false;

  // Supabase publishable keys cannot bypass RLS.
  return !key.startsWith("sb_publishable_");
}

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

  const { user, profile, supabase: authedSupabase } = context;
  const body = await request.json();

  if (profile?.clinic_id) {
    return NextResponse.json({ error: "Clinic already initialized." }, { status: 400 });
  }

  const supabase = hasPrivilegedServiceKey() ? createSupabaseServiceClient() : authedSupabase;

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .insert({ name: body.name, plan: body.plan ?? "starter" })
    .select("*")
    .single();

  if (clinicError) {
    if (clinicError.message.includes("row-level security policy") && clinicError.message.includes("clinics")) {
      return NextResponse.json(
        {
          error:
            "Nao foi possivel criar a clinica por politica de seguranca (RLS). Aplique o schema SQL no Supabase e garanta a policy clinic_insert_authenticated.",
        },
        { status: 400 },
      );
    }

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
