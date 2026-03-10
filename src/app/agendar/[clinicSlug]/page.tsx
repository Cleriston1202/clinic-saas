import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Clinic, Doctor, Service } from "@/types/database";
import PublicBookingFlow from "@/components/public-booking/PublicBookingFlow";
import { createPublicAppointment } from "@/app/agendar/actions";
import { resolveClinicBySlug } from "@/lib/clinic/resolveClinicBySlug";

interface Params {
  params: {
    clinicSlug: string;
  };
}

export default async function PublicBookingPage({ params }: Params) {
  noStore();

  const supabase = createSupabaseAdminClient();

  const clinic = (await resolveClinicBySlug(supabase, params.clinicSlug)) as Pick<Clinic, "id" | "name" | "slug"> | null;

  if (!clinic) {
    notFound();
  }

  const [{ data: services, error: servicesError }, { data: professionals, error: professionalsError }] = await Promise.all([
    supabase.from("services").select("*").eq("clinic_id", clinic.id).order("name", { ascending: true }),
    supabase.from("doctors").select("*").eq("clinic_id", clinic.id).order("name", { ascending: true }),
  ]);

  if (servicesError || professionalsError) {
    throw new Error(servicesError?.message ?? professionalsError?.message ?? "Falha ao carregar dados publicos da clinica.");
  }

  return (
    <PublicBookingFlow
      clinic={clinic}
      services={(services ?? []) as Service[]}
      professionals={(professionals ?? []) as Doctor[]}
      createAction={createPublicAppointment}
    />
  );
}
