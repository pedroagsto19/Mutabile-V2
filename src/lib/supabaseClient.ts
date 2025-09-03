import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

export function createClient(url: string, key: string): SupabaseClient {
  return createSupabaseClient(url, key)
}

export type { SupabaseClient }