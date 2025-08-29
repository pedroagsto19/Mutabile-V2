import { supabase, hasValidSession } from './supabase';

export async function initializeDemoData() {
  if (!supabase) {
    throw new Error('Supabase não configurado');
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
    
    // Criar usuários demo no Supabase Auth e depois na tabela users
    const demoUsers = [
      {
        name: 'Marina Costa',
        email: 'marina@mutabile.com.br',
        password: 'admin123',
        role: 'Administradora',
        auth_level: 'admin',
        team_id: null
      },
      {
        name: 'Ana Silva',
        email: 'ana@mutabile.com.br',
        password: 'gestor123',
        role: 'Gerente de Projetos',
        auth_level: 'gestor',
        team_id: null
      },
      {
        name: 'Carlos Santos',
        email: 'carlos@mutabile.com.br',
        password: 'equipe123',
        role: 'Arquiteto',
        auth_level: 'equipe',
        team_id: null
      },
      {
        name: 'João Oliveira',
        email: 'joao@mutabile.com.br',
        password: 'leitor123',
        role: 'Cliente',
        auth_level: 'leitor',
        team_id: null
      }
    ];
    
    // Criar cada usuário no Supabase Auth e depois na tabela users
    for (const user of demoUsers) {
      console.log(`Criando usuário: ${user.email}`);
      
      // Primeiro, criar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          emailRedirectTo: undefined // Desabilitar confirmação por email
        }
      });
      
      if (authError) {
        console.error(`Erro ao criar usuário ${user.email} no Auth:`, authError);
        // Se o usuário já existe no Auth, tentar obter o ID
        const { data: existingAuthUser } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: user.password
        });
        
        if (existingAuthUser?.user) {
          // Usuário já existe no Auth, usar o ID existente
          await createUserProfile(existingAuthUser.user.id, user);
        }
        continue;
      }
      
      if (authData?.user) {
        // Criar o perfil do usuário na tabela users
        await createUserProfile(authData.user.id, user);
      }
    }
    
    console.log('Dados demo criados com sucesso');
    
  } catch (e: any) {
    console.error('initializeDemoData error:', e);
    throw new Error(`Falha ao inicializar dados: ${e?.message || 'erro desconhecido'}`);
  }
}

async function createUserProfile(userId: string, userData: any) {
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: userId,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      auth_level: userData.auth_level,
      team_id: userData.team_id,
      password_hash: '', // Não precisamos mais armazenar hash, o Supabase Auth cuida disso
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  
  if (profileError) {
    console.error(`Erro ao criar perfil para ${userData.email}:`, profileError);
  } else {
    console.log(`Perfil criado para ${userData.email}`);
  }
}