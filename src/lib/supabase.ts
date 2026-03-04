import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (name: string) => {
  return import.meta.env[name] || 
         import.meta.env[`VITE_${name}`] || 
         (typeof process !== 'undefined' ? (process.env[name] || process.env[`VITE_${name}`]) : undefined);
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

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

