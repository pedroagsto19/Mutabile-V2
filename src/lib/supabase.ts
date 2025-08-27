import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate and provide fallback for URL to prevent TypeError
function getValidSupabaseUrl(url: string | undefined): string {
  if (!url) return 'https://placeholder.supabase.co';
  
  try {
    new URL(url);
    return url;
  } catch {
    console.warn('Invalid VITE_SUPABASE_URL provided, using fallback');
    return 'https://placeholder.supabase.co';
  }
}

const validUrl = getValidSupabaseUrl(url);
const validKey = key || 'placeholder-key';

export const assertEnv = () => {
  const problems: string[] = [];
  if (!url) problems.push('VITE_SUPABASE_URL ausente');
  if (!key) problems.push('VITE_SUPABASE_ANON_KEY ausente');
  if (url && !url.startsWith('https://')) problems.push('VITE_SUPABASE_URL deve iniciar com https://');
  return problems;
};

export const supabase = createClient(validUrl, validKey);

export async function healthCheck(): Promise<{ ok: boolean; reason?: string }> {
  try {
    if (!url || !key) return { ok: false, reason: 'Env vars ausentes' };
    
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);
    
    const res = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      signal: ctrl.signal,
      headers: {
        // Supabase pode exigir ambos:
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    });
    clearTimeout(timeout);
    
    const bodyText = await res.text().catch(() => '');
    return { ok: res.ok, reason: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e: any) {
    if (e.name === 'AbortError') {
      return { ok: false, reason: 'Timeout (4s) - verifique CORS/URL' };
    }
    return { ok: false, reason: e?.message || 'Failed to fetch' };
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