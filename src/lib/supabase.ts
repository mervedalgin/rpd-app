import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side (API routes) veya client-side (tarayıcı) için uygun değişkeni seç
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}

const _supabaseClient: SupabaseClient | null = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Returns the Supabase client or throws if not configured.
 * Prefer this over the direct `supabase` export.
 */
export function getSupabase(): SupabaseClient {
  if (!_supabaseClient) {
    throw new Error("Supabase is not configured. Please check your environment variables.");
  }
  return _supabaseClient;
}

// Backward compatibility export - prefer getSupabase() for new code
export const supabase = _supabaseClient as SupabaseClient;
