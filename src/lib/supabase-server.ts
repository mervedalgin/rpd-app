import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with service_role key.
 * ONLY use in API routes (server-side). Never import in "use client" files.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _serverClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (!_serverClient) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server Supabase config missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
    }
    _serverClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return _serverClient;
}
