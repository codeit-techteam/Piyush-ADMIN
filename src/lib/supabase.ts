import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

let client: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient | null {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }
  if (!client) {
    client = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { realtime: { params: { eventsPerSecond: 20 } } },
    );
  }
  return client;
}
