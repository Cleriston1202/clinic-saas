import { NextRequest } from "next/server";
import { createSupabaseApiClient } from "@/lib/supabase";
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

  const profile = {
    clinic_id: clinicContext.clinicId,
    role: clinicContext.role,
  };

  return { supabase, user, profile };
}
