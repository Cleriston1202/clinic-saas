import { NextRequest, NextResponse } from "next/server";
import { getUserAndClinic } from "@/app/api/_utils";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function hasPrivilegedServiceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return false;

  // Supabase publishable keys cannot bypass RLS.
  return !key.startsWith("sb_publishable_");
}

function serviceKeyLooksPublishable() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return false;
  return key.startsWith("sb_publishable_");
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
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const plan = typeof body?.plan === "string" ? body.plan : "starter";

  if (!name) {
    return NextResponse.json({ error: "Nome da clinica e obrigatorio." }, { status: 400 });
  }

  if (profile?.clinic_id) {
    return NextResponse.json({ error: "Clinic already initialized." }, { status: 400 });
  }

  const hasServiceRole = hasPrivilegedServiceKey();
  const primaryClient = hasServiceRole ? createSupabaseAdminClient() : authedSupabase;

  let { data: clinic, error: clinicError } = await primaryClient
    .from("clinics")
    .insert({ name, plan })
    .select("*")
    .single();

  const isClinicsRlsError =
    clinicError?.message.includes("row-level security policy") && clinicError.message.includes("clinics");

  // In case of transient policy drift, retry bootstrap with service role when available.
  if (!clinic && isClinicsRlsError && hasServiceRole) {
    const serviceClient = createSupabaseAdminClient();
    const retried = await serviceClient.from("clinics").insert({ name, plan }).select("*").single();
    clinic = retried.data;
    clinicError = retried.error;
  }

  if (clinicError || !clinic) {
    if (isClinicsRlsError) {
      if (serviceKeyLooksPublishable()) {
        return NextResponse.json(
          {
            error:
              "SUPABASE_SERVICE_ROLE_KEY esta usando uma chave publishable (sb_publishable_), que nao pode ignorar RLS. Use a chave service_role/secret do Supabase em Settings > API e reinicie o servidor.",
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          error: hasServiceRole
            ? "Nao foi possivel criar a clinica por politica de seguranca (RLS). Verifique se o schema SQL foi aplicado no Supabase e se a policy clinic_insert_authenticated existe."
            : "Nao foi possivel criar a clinica por politica de seguranca (RLS). Configure SUPABASE_SERVICE_ROLE_KEY no .env e aplique o schema SQL no Supabase.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: clinicError?.message ?? "Falha ao criar clinica." }, { status: 400 });
  }

  const writeClient = hasServiceRole ? createSupabaseAdminClient() : authedSupabase;
  const { error: memberError } = await writeClient.from("clinic_members").upsert(
    {
      clinic_id: clinic.id,
      user_id: user.id,
      role: "admin",
    },
    { onConflict: "clinic_id,user_id" },
  );

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  const { error: userError } = await writeClient.from("users").upsert(
    {
      id: user.id,
      clinic_id: clinic.id,
      email: user.email ?? body.email,
      role: "admin", // Legacy compatibility while the app transitions fully to clinic_members.
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
