let cachedClient: any;

function resolveSupabaseGlobal() {
  if (typeof window === 'undefined') {
    return null;
  }

  const globalSupabase = (window as any).supabase || (window as any).Supabase || (window as any).SupabaseClient;
  return globalSupabase?.createClient ? globalSupabase : null;
}

export function createClient(url: string, key: string) {
  if (cachedClient) {
    return cachedClient;
  }

  if (typeof window === 'undefined') {
    cachedClient = {};
    return cachedClient;
  }

  const supabaseGlobal = resolveSupabaseGlobal();
  if (!supabaseGlobal) {
    throw new Error(
      'Biblioteca do Supabase não encontrada. Garanta que o script CDN do Supabase foi carregado antes da aplicação.'
    );
  }

  cachedClient = supabaseGlobal.createClient(url, key);
  return cachedClient;
}
