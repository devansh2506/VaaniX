import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createLocalClient, isLocalMode } from './local';

export function createAdminClient() {
  if (isLocalMode()) {
    return createLocalClient() as ReturnType<typeof createSupabaseClient<Database>>;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    // In build or development without service key, use placeholder to prevent build crash
    return createSupabaseClient<Database>(supabaseUrl, 'placeholder-service-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
