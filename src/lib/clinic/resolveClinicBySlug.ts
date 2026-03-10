import { SupabaseClient } from "@supabase/supabase-js";

export interface ResolvedClinic {
  id: string;
  name: string;
  slug: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function fallbackSlug(name: string, id: string) {
  const base = slugify(name);
  if (!base) return `clinica-${id.slice(0, 6)}`;
  return `${base}-${id.slice(0, 6)}`;
}

export async function resolveClinicBySlug(supabase: SupabaseClient, clinicSlug: string): Promise<ResolvedClinic | null> {
  const normalizedSlug = clinicSlug.trim().toLowerCase();
  if (!normalizedSlug) return null;

  const withSlug = await supabase
    .from("clinics")
    .select("id,name,slug")
    .eq("slug", normalizedSlug)
    .maybeSingle<{ id: string; name: string; slug: string }>();

  if (!withSlug.error && withSlug.data) {
    return {
      id: withSlug.data.id,
      name: withSlug.data.name,
      slug: withSlug.data.slug,
    };
  }

  if (withSlug.error && !withSlug.error.message.includes("column clinics.slug does not exist")) {
    throw new Error(withSlug.error.message);
  }

  const withoutSlug = await supabase
    .from("clinics")
    .select("id,name,slug")
    .order("created_at", { ascending: true });

  if (withoutSlug.error) {
    throw new Error(withoutSlug.error.message);
  }

  const matches = (withoutSlug.data ?? []).filter((clinic) => {
    const persistedSlug = typeof clinic.slug === "string" ? clinic.slug.trim().toLowerCase() : "";
    const base = slugify(clinic.name);
    if (persistedSlug && persistedSlug === normalizedSlug) return true;
    if (base === normalizedSlug) return true;
    if (fallbackSlug(clinic.name, clinic.id) === normalizedSlug) return true;
    // Accept base alias for generated slugs like `clinica-xpto-abc123`.
    return persistedSlug ? persistedSlug.startsWith(`${normalizedSlug}-`) : false;
  });

  if (matches.length === 0) return null;
  if (matches.length > 1) {
    // Avoid booking into the wrong clinic when alias is ambiguous.
    return null;
  }

  const matched = matches[0];
  const persistedSlug = typeof matched.slug === "string" ? matched.slug.trim() : "";

  return {
    id: matched.id,
    name: matched.name,
    slug: persistedSlug || fallbackSlug(matched.name, matched.id),
  };
}
