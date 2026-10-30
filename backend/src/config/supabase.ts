import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

let supabaseClient: SupabaseClient | null = null;

if (env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY!;
  supabaseClient = createClient(env.SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  console.log('✓ Supabase client initialized with endpoint:', env.SUPABASE_URL);
} else {
  console.log('ℹ Supabase credentials not found in env. Running with built-in persistent relational store.');
}

export const getSupabase = (): SupabaseClient | null => supabaseClient;
