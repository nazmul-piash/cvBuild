import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// We use a proxy or a getter to prevent crashing on module load
// while still providing a helpful error if the client is actually used.
let supabaseInstance: SupabaseClient | null = null;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!supabaseInstance) {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'Supabase credentials missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Secrets panel in AI Studio.'
        );
      }
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
    return (supabaseInstance as any)[prop];
  }
});
