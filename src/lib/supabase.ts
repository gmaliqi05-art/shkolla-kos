import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function createSupabaseClient(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      'Missing Supabase environment variables.',
      'VITE_SUPABASE_URL:', url ? 'set' : 'MISSING',
      'VITE_SUPABASE_ANON_KEY:', key ? 'set' : 'MISSING'
    );
  }

  return createClient(
    url || 'https://placeholder.supabase.co',
    key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );
}

export const supabase = createSupabaseClient();
