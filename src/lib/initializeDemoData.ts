import { supabase, hasValidSession } from './supabase';

export async function initializeDemoData() {
  if (!supabase) {
    throw new Error('Supabase não configurado');
  }

  // Verificar se há sessão válida antes de prosseguir
  const hasSession = await hasValidSession();
  if (!hasSession) {
    throw new Error('Sem sessão válida. Faça login primeiro.');
  }

  try {
    console.log('Inicializando dados demo...');
    
    // Verificar se já existem usuários
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('Erro ao verificar usuários existentes:', checkError);
      throw new Error(`Falha ao verificar dados: ${checkError.message}`);
    }
    
    // Se já existem usuários, não fazer nada
    if (existingUsers && existingUsers.length > 0) {
      console.log('Dados demo já existem, pulando inicialização');
      return;
    }
    
    // Criar usuários demo apenas se não existirem
    const demoUsers = [
      {
        name: 'Marina Costa',
        email: 'marina@mutabile.com.br',
        role: 'Administradora',
        auth_level: 'admin',
        password_hash: '1804289383', // hash of 'admin123'
        team_id: 'team1'
      },
      {
        name: 'Ana Silva',
        email: 'ana@mutabile.com.br',
        role: 'Gerente de Projetos',
        auth_level: 'gestor',
        password_hash: '846930886', // hash of 'gestor123'
        team_id: 'team1'
      },
      {
        name: 'Carlos Santos',
        email: 'carlos@mutabile.com.br',
        role: 'Arquiteto',
        auth_level: 'equipe',
        password_hash: '1681692777', // hash of 'equipe123'
        team_id: 'team1'
      },
      {
        name: 'João Oliveira',
        email: 'joao@mutabile.com.br',
        role: 'Cliente',
        auth_level: 'leitor',
        password_hash: '1714636915', // hash of 'leitor123'
        team_id: 'team1'
      }
    ];
    
    const { error: insertError } = await supabase
      .from('users')
      .insert(demoUsers);
    
    if (insertError) {
      console.error('Erro ao criar usuários demo:', insertError);
      throw new Error(`Falha ao criar dados demo: ${insertError.message}`);
    }
    
    console.log('Dados demo criados com sucesso');
    
  } catch (e: any) {
    console.error('initializeDemoData error:', e);
    throw new Error(`Falha ao inicializar dados: ${e?.message || 'erro desconhecido'}`);
  }
}