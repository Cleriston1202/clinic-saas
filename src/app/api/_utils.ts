import { NextRequest } from "next/server";
import { createSupabaseApiClient } from "@/lib/supabase";

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

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("clinic_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message, status: 400 as const };
  }

  return { supabase, user, profile };
}
