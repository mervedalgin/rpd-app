import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side (API routes) veya client-side (tarayıcı) için uygun değişkeni seç
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper function - supabase null ise hata fırlat
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error("Supabase is not configured. Please check your environment variables.");
  }
  return supabase;
}
