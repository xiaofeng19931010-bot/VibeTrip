export * from './schemas/index.js';
export * from './supabase/index.js';
export * from './repositories/index.js';
export * from './engine/index.js';

export interface CoreConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export async function createCore(config: CoreConfig) {
  const { initSupabase } = await import('./supabase/index.js');
  initSupabase(config);
  return {
    config,
    isInitialized: true,
  };
}
