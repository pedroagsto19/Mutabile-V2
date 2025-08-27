import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we have valid Supabase configuration
const hasValidSupabaseConfig = supabaseUrl !== 'https://placeholder.supabase.co' && 
                               supabaseAnonKey !== 'placeholder-key' &&
                               supabaseUrl.startsWith('https://') &&
                               supabaseUrl.includes('.supabase.co');

if (!hasValidSupabaseConfig) {
  console.warn('Supabase not configured. Using fallback values. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to hash passwords (simple for demo)
export function hashPassword(password: string): string {
  // In production, use bcrypt or similar
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString();
}

// Helper function to verify passwords
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}