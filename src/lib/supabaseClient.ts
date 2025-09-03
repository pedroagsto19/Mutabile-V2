type Session = { user: { id: string; email: string } } | null;
type Listener = (event: string, session: Session) => void;

let currentSession: Session = null;
let listeners: Listener[] = [];

export interface SupabaseClient {
  auth: {
    getSession: () => Promise<{ data: { session: Session } }>;
    signInWithPassword: (args: { email: string; password: string }) => Promise<{ data: { session: Session; user: any }; error: null }>;
    signOut: () => Promise<{ error: null }>;
    onAuthStateChange: (callback: Listener) => { data: { subscription: { unsubscribe: () => void } } };
  };
}

export function createClient(_url: string, _key: string): SupabaseClient {
  return {
    auth: {
      getSession: async () => ({ data: { session: currentSession } }),
      signInWithPassword: async ({ email }) => {
        currentSession = { user: { id: 'demo', email } };
        listeners.forEach((cb) => cb('SIGNED_IN', currentSession));
        return { data: { session: currentSession, user: currentSession.user }, error: null };
      },
      signOut: async () => {
        currentSession = null;
        listeners.forEach((cb) => cb('SIGNED_OUT', null));
        return { error: null };
      },
      onAuthStateChange: (callback: Listener) => {
        listeners.push(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                listeners = listeners.filter((cb) => cb !== callback);
              },
            },
          },
        };
      },
    },
  };
}
