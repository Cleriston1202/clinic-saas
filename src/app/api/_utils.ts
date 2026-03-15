import { NextRequest } from "next/server";
import { createSupabaseApiClient } from "@/lib/supabase";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentClinic } from "@/lib/clinic/getCurrentClinic";

export function getBearerToken(request: NextRequest) {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) return undefined;
  return value.replace("Bearer ", "");
}

export async function getUserAndClinic(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    return { error: "Não autorizado", status: 401 as const };
  }

  const supabase = createSupabaseApiClient(token);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { error: "Não autorizado", status: 401 as const };
  }

  let clinicContext;
  try {
    clinicContext = await getCurrentClinic(supabase, user);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao carregar contexto da clinica.",
      status: 400 as const,
    };
  }

  // Fallback for environments where legacy users.clinic_id is out of sync but clinic_members is populated.
  if (!clinicContext.clinicId) {
    try {
      const admin = createSupabaseAdminClient();
      const { data: member } = await admin
        .from("clinic_members")
        .select("clinic_id,role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle<{ clinic_id: string; role: string }>();

      if (member?.clinic_id) {
        clinicContext = {
          clinicId: member.clinic_id,
          role: member.role ?? clinicContext.role,
        };

        // Keep legacy table synchronized for helpers/functions that still depend on users.clinic_id.
        await admin
          .from("users")
          .upsert(
            {
              id: user.id,
              email: user.email ?? "",
              clinic_id: member.clinic_id,
              role: member.role ?? "receptionist",
            },
            { onConflict: "id" },
          )
          .select("id")
          .maybeSingle();
      }
    } catch {
      // Ignore fallback errors here; caller handles missing clinic gracefully.
    }
  }

  const profile = {
    clinic_id: clinicContext.clinicId,
    role: clinicContext.role,
  };

  return { supabase, user, profile };
}
