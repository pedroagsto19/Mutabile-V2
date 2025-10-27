import { supabase } from './supabase';
import { projectOperations, userOperations } from './database';

export async function testSupabaseConnection() {
  const results = {
    auth: { success: false, error: null as any },
    users: { success: false, count: 0, error: null as any },
    projects: { success: false, count: 0, error: null as any },
    clients: { success: false, count: 0, error: null as any },
    suppliers: { success: false, count: 0, error: null as any }
  };

  console.log('🔍 Testando conexão com Supabase...\n');

  // Test 1: Auth Session
  try {
    const { data, error } = await supabase.auth.getSession();
    results.auth.success = !error;
    results.auth.error = error;
    console.log('✅ Auth Session:', data.session ? 'Autenticado' : 'Não autenticado');
  } catch (error) {
    results.auth.error = error;
    console.error('❌ Erro ao verificar sessão:', error);
  }

  // Test 2: Users Table
  try {
    const users = await userOperations.getAll();
    results.users.success = true;
    results.users.count = users.length;
    console.log(`✅ Tabela users: ${users.length} registros`);
    if (users.length > 0) {
      console.log('   Usuários:', users.map(u => `${u.name} (${u.authLevel})`).join(', '));
    }
  } catch (error) {
    results.users.error = error;
    console.error('❌ Erro ao ler tabela users:', error);
  }

  // Test 3: Projects Table
  try {
    const projects = await projectOperations.getAll();
    results.projects.success = true;
    results.projects.count = projects.length;
    console.log(`✅ Tabela projects: ${projects.length} registros`);
  } catch (error) {
    results.projects.error = error;
    console.error('❌ Erro ao ler tabela projects:', error);
  }

  // Test 4: Clients Table
  try {
    const { data, error } = await supabase.from('clients').select('count');
    if (error) throw error;
    results.clients.success = true;
    results.clients.count = data?.length || 0;
    console.log(`✅ Tabela clients: ${results.clients.count} registros`);
  } catch (error) {
    results.clients.error = error;
    console.error('❌ Erro ao ler tabela clients:', error);
  }

  // Test 5: Suppliers Table
  try {
    const { data, error } = await supabase.from('suppliers').select('count');
    if (error) throw error;
    results.suppliers.success = true;
    results.suppliers.count = data?.length || 0;
    console.log(`✅ Tabela suppliers: ${results.suppliers.count} registros`);
  } catch (error) {
    results.suppliers.error = error;
    console.error('❌ Erro ao ler tabela suppliers:', error);
  }

  console.log('\n📊 Resumo dos Testes:');
  console.log('Auth:', results.auth.success ? '✅' : '❌');
  console.log('Users:', results.users.success ? '✅' : '❌');
  console.log('Projects:', results.projects.success ? '✅' : '❌');
  console.log('Clients:', results.clients.success ? '✅' : '❌');
  console.log('Suppliers:', results.suppliers.success ? '✅' : '❌');

  return results;
}
