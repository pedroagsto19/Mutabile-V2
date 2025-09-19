export {}; // garante que seja tratado como módulo

declare global {
  interface Window {
    supabase?: {
      createClient: (url: string, key: string) => any;
    };
    Supabase?: {
      createClient: (url: string, key: string) => any;
    };
    SupabaseClient?: {
      createClient: (url: string, key: string) => any;
    };
  }
}
