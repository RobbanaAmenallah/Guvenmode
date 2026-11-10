import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

let supabaseClient: SupabaseClient | null = null;

function decodeJwtRole(jwt?: string): string | null {
  if (!jwt) return null;
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    return payload.role || null;
  } catch {
    return null;
  }
}

const targetUrl = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.SUPABASE_ANON_KEY;

if (targetUrl && (serviceKey || anonKey)) {
  const keyToUse = serviceKey || anonKey!;
  const role = decodeJwtRole(keyToUse);

  if (env.NODE_ENV === 'production' && role !== 'service_role') {
    console.warn('⚠ AVERTISSEMENT SÉCURITÉ: SUPABASE_SERVICE_ROLE_KEY absente ou invalide (rôle détecté:', role || 'inconnu', '). Les opérations admin et uploads peuvent être bloqués par RLS.');
  }

  supabaseClient = createClient(targetUrl, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  console.log('✓ Supabase client initialized with endpoint:', targetUrl, `(role: ${role || 'custom'})`);
} else {
  console.log('ℹ Supabase credentials not found in env. Running with built-in persistent store.');
}

export const getSupabase = (): SupabaseClient | null => supabaseClient;
