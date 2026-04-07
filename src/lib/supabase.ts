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

/**
 * Returns the Supabase client (anon key) or throws if not configured.
 * Safe for both client and server-side use.
 * For admin operations in API routes, use getSupabaseServer() from '@/lib/supabase-server'.
 */
export function getSupabase(): SupabaseClient {
  if (!_supabaseClient) {
    throw new Error("Supabase is not configured. Please check your environment variables.");
  }
  return _supabaseClient;
}

// Backward compatibility export - prefer getSupabase() for new code
export const supabase = _supabaseClient as SupabaseClient;
