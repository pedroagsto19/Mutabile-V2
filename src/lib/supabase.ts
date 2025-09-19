// src/lib/supabase.ts
import { createClient } from './supabaseClient';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * Valida as variáveis de ambiente exigidas pelo Supabase.
 * Retorna uma lista de problemas encontrados (string vazia = ok).
 */
export function assertEnv(): string[] {
  const problems: string[] = [];
  if (!url) problems.push('VITE_SUPABASE_URL ausente');
  if (!key) problems.push('VITE_SUPABASE_ANON_KEY ausente');

  if (url && !/^https:\/\/.+/.test(url))
    problems.push('VITE_SUPABASE_URL deve iniciar com https://');

  try {
    if (url) new URL(url);
  } catch {
    problems.push('VITE_SUPABASE_URL inválida (URL malformada)');
  }

  return problems;
}

// Falha rápido para evitar 400 "No API key found in request"
const problems = assertEnv();
if (problems.length) {
  throw new Error(`Config Supabase inválida: ${problems.join(' | ')}`);
}

let clientInstance: any;

function ensureClient() {
  if (!clientInstance) {
    clientInstance = createClient(url!, key!);
  }
  return clientInstance;
}

export const supabase = ensureClient();

/**
 * Health check simples do endpoint de Auth do Supabase.
 */
export async function healthCheck(): Promise<{ ok: boolean; reason?: string; status?: number }> {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 8000); // Increased timeout

    const res = await fetch(`${url!}/auth/v1/health`, {
      method: 'GET',
      signal: ctrl.signal,
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key!}`,
      },
    });

    clearTimeout(timeout);
    return { ok: res.ok, reason: res.ok ? undefined : res.statusText, status: res.status };
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return { ok: false, reason: 'Timeout (8s) - verifique CORS/URL' };
    }
    if (e?.message?.includes('Failed to fetch')) {
      return { ok: false, reason: 'Falha de rede - verifique conectividade' };
    }
    return { ok: false, reason: e?.message || 'Failed to fetch' };
  }
}

/**
 * Traduz erros comuns do Supabase/Fetch para mensagens amigáveis.
 */
export function explainSupabaseError(e: any): string {
  if (!e) return 'Erro desconhecido';

  const msg = String(e.message || e.error_description || '').toLowerCase();

  if (msg.includes('no api key') || msg.includes('apikey')) {
    return 'Chave de API não enviada. Verifique VITE_SUPABASE_ANON_KEY e a inicialização do cliente.';
  }
  if (msg.includes('invalid_credentials') || msg.includes('invalid login credentials')) {
    return 'E-mail ou senha inválidos.';
  }
  if (msg.includes('failed to fetch') || e?.name === 'TypeError') {
    return 'Falha de conexão com o Supabase. Verifique URL, chave e CORS (Origins).';
  }
  if (e?.status === 400) return 'Requisição inválida (400). Revise headers/endpoint.';
  if (e?.status === 401) return 'Não autorizado (401). Chave inválida/ausente.';

  const code = e?.code ? ` (${e.code})` : '';
  return `${e?.message || 'Erro desconhecido'}${code}`;
}

/**
 * Retorna true se há sessão válida.
 */
export async function hasValidSession(): Promise<boolean> {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session check timeout')), 5000)
    );
    
    const sessionPromise = supabase.auth.getSession();
    const { data } = await Promise.race([sessionPromise, timeoutPromise]);
    return Boolean(data?.session);
  } catch (e) {
    console.error('Erro ao verificar sessão:', e);
    return false;
  }
}
