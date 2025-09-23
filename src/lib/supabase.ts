import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

let clientInstance: SupabaseClient | null = null;

function createStubClient(): SupabaseClient {
  return new Proxy({}, {
    get() {
      throw new Error('Supabase não configurado');
    }
  }) as SupabaseClient;
}

function createSupabaseClient(): SupabaseClient {
  if (!url || !key) {
    console.error('Supabase não configurado - variáveis de ambiente ausentes');
    return createStubClient();
  }

  try {
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (error) {
    console.error('Erro ao criar cliente Supabase:', error);
    return createStubClient();
  }
}

export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createSupabaseClient();
  }
  return clientInstance;
}

export const supabase = getSupabaseClient();
