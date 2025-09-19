import { createClient } from './supabaseClient';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Simple validation
if (!url || !key) {
  console.error('Supabase não configurado - variáveis de ambiente ausentes');
}

let clientInstance: any;

function ensureClient() {
  if (!clientInstance && url && key) {
    try {
      clientInstance = createClient(url, key);
    } catch (error) {
      console.error('Erro ao criar cliente Supabase:', error);
    }
  }
  return clientInstance;
}

export const supabase = ensureClient();