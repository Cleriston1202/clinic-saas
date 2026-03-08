import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Important runtime guard to fail early when env vars are not configured.
  console.warn("Supabase env variables are missing.");
}

function assertValidSupabaseUrl(url: string | undefined) {
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não está configurada.");
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error();
    }
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL inválida. Use a URL HTTPS do projeto Supabase.");
  }
}

export const createSupabaseBrowserClient = () =>
  (assertValidSupabaseUrl(supabaseUrl), createClient(supabaseUrl, supabaseAnonKey ?? ""));

export const createSupabaseApiClient = (accessToken?: string) =>
  (assertValidSupabaseUrl(supabaseUrl), createClient(supabaseUrl, supabaseAnonKey ?? "", {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  }));

export const createSupabaseServiceClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for service operations.");
  }

  assertValidSupabaseUrl(supabaseUrl);

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
