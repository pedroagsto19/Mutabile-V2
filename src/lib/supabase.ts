import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const assertEnv = () => {
  const problems: string[] = [];
  if (!url) problems.push('VITE_SUPABASE_URL ausente');
  if (!key) problems.push('VITE_SUPABASE_ANON_KEY ausente');
  if (url && !url.startsWith('https://')) problems.push('VITE_SUPABASE_URL deve iniciar com https://');
  return problems;
};

export const supabase = (url && key) ? createClient(url, key) : null;

export async function healthCheck(): Promise<{ ok: boolean; reason?: string }> {
  try {
    if (!url) return { ok: false, reason: 'URL ausente' };
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${url}/auth/v1/health`, { 
      signal: ctrl.signal,
      method: 'GET'
    });
    clearTimeout(timeout);
    return { ok: res.ok, reason: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e: any) {
    if (e.name === 'AbortError') {
      return { ok: false, reason: 'Timeout (4s) - verifique CORS/URL' };
    }
    return { ok: false, reason: e?.message || 'Falha no fetch' };
  }
}

export function explainSupabaseError(e: any): string {
  if (!e) return 'Erro desconhecido';
  
  // TypeError: Failed to fetch
  if (e.name === 'TypeError' && e.message?.includes('Failed to fetch')) {
    return 'Conexão com Supabase falhou. Verifique CORS/URL/Key.';
  }
  
  // Supabase auth errors
  if (e.message?.toLowerCase().includes('invalid_credentials') || 
      e.message?.toLowerCase().includes('invalid login credentials')) {
    return 'E-mail ou senha inválidos.';
  }
  
  // Network/fetch errors
  if (e.name === 'FetchError' || e.message?.includes('fetch')) {
    return 'Falha de conexão com o Supabase. Verifique URL/Key e CORS.';
  }
  
  // Default with error code if available
  const code = e.code ? ` (${e.code})` : '';
  return `${e.message || 'Erro desconhecido'}${code}`;
}

// Helper para verificar se há sessão válida
export async function hasValidSession(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (e) {
    console.error('Erro ao verificar sessão:', e);
    return false;
  }
}