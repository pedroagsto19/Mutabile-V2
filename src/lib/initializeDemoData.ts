import { supabase } from './supabase';
import { projectOperations, clientOperations, supplierOperations, defaultActivityOperations } from './database';

export async function initializeDemoData() {
  try {
    console.log('Verificando dados do sistema...');
    
    // Verificar se há um usuário autenticado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('Nenhum usuário autenticado.');
      return;
    }
    
    console.log('Sistema pronto para uso com dados reais');
    console.log('Verificando estrutura do banco...');
    
    try {
      const projects = await projectOperations.getAll();
      const clients = await clientOperations.getAll();
      console.log(`Sistema inicializado: ${projects.length} projetos e ${clients.length} clientes`);
    } catch (error) {
      console.error('Erro ao verificar estrutura:', error);
    }
    
  } catch (e: any) {
    console.error('Erro na verificação do sistema:', e);
    console.log('Sistema pode estar sendo inicializado...');
  }
}
