import { supabase } from './supabase';

export async function initializeDemoData() {
  try {
    console.log('Verificando sistema...');
    
    // Verificar se há um usuário autenticado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('Nenhum usuário autenticado.');
      return;
    }
    
    console.log('Sistema pronto para uso com dados reais');
    console.log('Usuário autenticado:', session.user.email);
    
  } catch (e: any) {
    console.error('Erro na verificação do sistema:', e);
  }
}