import { SupabaseClient, User } from "@supabase/supabase-js";

interface MemberRow {
  clinic_id: string;
  role: string;
}

interface LegacyUserRow {
  clinic_id: string | null;
  role: string | null;
}

export interface CurrentClinicContext {
  clinicId: string | null;
  role: string | null;
}

export async function getCurrentClinic(supabase: SupabaseClient, user: User): Promise<CurrentClinicContext> {
  const { data: legacyProfile, error: legacyError } = await supabase
    .from("users")
    .select("clinic_id,role")
    .eq("id", user.id)
    .maybeSingle<LegacyUserRow>();

  if (legacyError) {
    throw new Error(legacyError.message);
  }

  if (legacyProfile?.clinic_id) {
    return {
      clinicId: legacyProfile.clinic_id,
      role: legacyProfile.role ?? null,
    };
  }

  const { data: member, error: memberError } = await supabase
    .from("clinic_members")
    .select("clinic_id,role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<MemberRow>();

  if (!memberError && member?.clinic_id) {
    return { clinicId: member.clinic_id, role: member.role };
  }

  return {
    clinicId: legacyProfile?.clinic_id ?? null,
    role: legacyProfile?.role ?? null,
  };
}
