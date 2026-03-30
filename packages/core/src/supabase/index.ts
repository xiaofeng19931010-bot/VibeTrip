import { createClient } from '@supabase/supabase-js';
import type { Database } from './types.js';

export interface SupabaseClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface SupabaseClientOptions extends SupabaseClientConfig {
  auth?: {
    persistSession?: boolean;
    autoRefreshToken?: boolean;
  };
}

let globalSupabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export function createSupabaseClient(config: SupabaseClientOptions) {
  const client = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: config.auth?.persistSession ?? false,
      autoRefreshToken: config.auth?.autoRefreshToken ?? true,
    },
  });
  return client;
}

export function getGlobalSupabaseClient(): ReturnType<typeof createClient<Database>> | null {
  return globalSupabaseClient;
}

export function setGlobalSupabaseClient(client: ReturnType<typeof createClient<Database>>): void {
  globalSupabaseClient = client;
}

export function initSupabase(config: SupabaseClientConfig): ReturnType<typeof createClient<Database>> {
  const client = createSupabaseClient(config);
  setGlobalSupabaseClient(client);
  return client;
}
