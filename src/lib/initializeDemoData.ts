import { supabase, hasValidSession } from './supabase';
import { LocalStorage } from './localStorage';

export async function initializeDemoData() {
  try {
    console.log('Inicializando dados demo...');
    
    // Verificar se já existem usuários no localStorage
    const existingUsers = LocalStorage.getUsers();
    
    if (existingUsers.length > 0) {
      console.log('Dados demo já existem, pulando inicialização');
      return;
    }
    
    // Inicializar dados padrão no localStorage
    LocalStorage.initializeDefaultData();
    
    console.log('Dados demo criados com sucesso');
    
  } catch (e: any) {
    console.error('initializeDemoData error:', e);
    throw new Error(`Falha ao inicializar dados: ${e?.message || 'erro desconhecido'}`);
  }