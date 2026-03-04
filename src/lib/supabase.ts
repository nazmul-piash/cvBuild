import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : undefined);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : undefined);

// We use a proxy or a getter to prevent crashing on module load
// while still providing a helpful error if the client is actually used.
let supabaseInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!supabaseInstance) {
      if (!isSupabaseConfigured) {
        // Return a dummy object that doesn't crash but warns
        console.warn('Supabase credentials missing.');
        return () => ({ data: null, error: new Error('Supabase not configured') });
      }
      supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!);
    }
    return (supabaseInstance as any)[prop];
  }
});

