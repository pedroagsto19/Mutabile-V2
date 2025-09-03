export interface SupabaseClient {
  auth: {
    getSession: () => Promise<{ data: { session: any } }>
    signOut: () => Promise<{ error: null }>
    onAuthStateChange: (callback: any) => { data: { subscription: { unsubscribe: () => void } } }
  }
}

export function createClient(_url: string, _key: string): SupabaseClient {
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  }
}
