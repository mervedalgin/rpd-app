import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Client-side: sadece anon key kullan (service_role key ASLA client'a gitmemeli)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

const _supabaseClient: SupabaseClient | null = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Env eksikse `null as SupabaseClient` yerine, erisimde NET hata firlatan bir
// Proxy don. Boylece kullanim noktalarinda "Cannot read properties of null"
// gibi anlamsiz bir crash yerine yapilandirma eksikligi acikca gorunur.
// (Tip `SupabaseClient` kaliyor; cagri noktalarinda guard zorunlulugu olusmaz.)
const missingConfigProxy = new Proxy({} as SupabaseClient, {
  get() {
    throw new Error(
      "Supabase istemcisi yapilandirilmamis. NEXT_PUBLIC_SUPABASE_URL ve " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY ortam degiskenlerini ayarlayin."
    );
  },
});

export const supabase = (_supabaseClient ?? missingConfigProxy) as SupabaseClient;
