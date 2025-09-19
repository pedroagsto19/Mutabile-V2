/*
  # Alinhar perfis de usuários com Supabase Auth

  1. Remover dados demo antigos baseados em senhas locais
  2. Atualizar políticas RLS para permitir sincronização por e-mail
  3. Garantir que usuários possam criar/atualizar seu próprio perfil
*/

-- Remover funções antigas ligadas a senhas locais (se existirem)
DROP FUNCTION IF EXISTS hash_password(text);
DROP FUNCTION IF EXISTS verify_password(text, text);
DROP FUNCTION IF EXISTS authenticate_user(text, text);

-- Atualizar políticas RLS dos perfis de usuário
DROP POLICY IF EXISTS "Users can view and edit their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update profile by email" ON users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON users;

CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update profile by email"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR email = COALESCE(auth.jwt() ->> 'email', '')
  )
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can delete their own profile"
  ON users
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- Remover dados demo antigos que conflitam com Supabase Auth
DELETE FROM commercial_activities
  WHERE id IN ('comm_001', 'comm_002', 'comm_003');

DELETE FROM proposals
  WHERE id IN ('proposal_001', 'proposal_002');

DELETE FROM checklist_items
  WHERE id IN ('check_001', 'check_002', 'check_003', 'check_004');

DELETE FROM activities
  WHERE id = 'activity_001';

DELETE FROM stages
  WHERE id = 'stage_001';

DELETE FROM projects
  WHERE id = 'project_001';

DELETE FROM suppliers
  WHERE id IN ('supplier_001', 'supplier_002', 'supplier_003');

DELETE FROM clients
  WHERE id IN ('client_001', 'client_002', 'client_003');

DELETE FROM default_activities
  WHERE (stage_name = 'Anteprojeto' AND title IN (
    'Levantamento e análise do terreno',
    'Programa de necessidades',
    'Estudo de viabilidade urbanística'
  ))
     OR (stage_name = 'Projeto Legal' AND title IN (
    'Desenvolvimento de plantas baixas técnicas',
    'Cortes e fachadas'
  ))
     OR (stage_name = 'Projeto Executivo' AND title = 'Detalhamento arquitetônico')
     OR (stage_name = 'Planejamento' AND title = 'Definição de escopo e cronograma');

DELETE FROM users
  WHERE email IN (
    'marina@mutabile.com.br',
    'ana@mutabile.com.br',
    'carlos@mutabile.com.br',
    'fernanda@mutabile.com.br',
    'roberto@mutabile.com.br',
    'joao@mutabile.com.br'
  );
