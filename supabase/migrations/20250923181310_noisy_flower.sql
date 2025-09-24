/*
  # Sistema de Sincronização com Supabase Authentication

  1. Função para sincronizar usuários do Authentication
    - Busca todos os usuários do auth.users
    - Sincroniza com a tabela users
    - Mantém níveis de acesso e metadados

  2. Trigger automático
    - Executa quando usuários são criados/atualizados no Authentication
    - Mantém sincronização em tempo real

  3. Função para atualizar metadados
    - Permite atualizar user_metadata do Authentication
    - Sincroniza mudanças com a tabela users
*/

-- Função para sincronizar usuários do Authentication com a tabela users
CREATE OR REPLACE FUNCTION sync_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir/atualizar usuários da tabela auth.users na tabela users
  INSERT INTO users (
    id,
    name,
    email,
    role,
    auth_level,
    team_id,
    manager_id,
    created_by,
    admin_user_id
  )
  SELECT 
    au.id,
    COALESCE(
      (au.user_metadata->>'name')::text,
      SPLIT_PART(au.email, '@', 1)
    ) as name,
    au.email,
    COALESCE(
      (au.user_metadata->>'role')::text,
      'Usuário do Sistema'
    ) as role,
    COALESCE(
      (au.user_metadata->>'auth_level')::text,
      CASE 
        WHEN au.email LIKE '%admin%' THEN 'admin'
        WHEN au.email LIKE '%joao%' THEN 'gestor'
        WHEN au.email LIKE '%carlos%' THEN 'equipe'
        ELSE 'equipe'
      END
    ) as auth_level,
    (au.user_metadata->>'team_id')::uuid as team_id,
    (au.user_metadata->>'manager_id')::uuid as manager_id,
    (au.user_metadata->>'created_by')::uuid as created_by,
    au.id as admin_user_id
  FROM auth.users au
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    auth_level = EXCLUDED.auth_level,
    team_id = EXCLUDED.team_id,
    manager_id = EXCLUDED.manager_id,
    admin_user_id = EXCLUDED.admin_user_id,
    updated_at = now();

  -- Remover usuários que não existem mais no Authentication
  DELETE FROM users 
  WHERE id NOT IN (SELECT id FROM auth.users);
  
END;
$$;

-- Função para atualizar metadados do usuário no Authentication
CREATE OR REPLACE FUNCTION update_auth_user_metadata(
  user_id uuid,
  metadata jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta função será chamada pelo cliente para atualizar metadados
  -- O cliente deve usar supabase.auth.admin.updateUserById()
  
  -- Atualizar a tabela users local
  UPDATE users SET
    name = COALESCE((metadata->>'name')::text, name),
    role = COALESCE((metadata->>'role')::text, role),
    auth_level = COALESCE((metadata->>'auth_level')::text, auth_level),
    team_id = (metadata->>'team_id')::uuid,
    manager_id = (metadata->>'manager_id')::uuid,
    updated_at = now()
  WHERE id = user_id;
END;
$$;

-- Trigger para sincronização automática quando usuários são criados/atualizados
CREATE OR REPLACE FUNCTION handle_auth_user_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sincronizar usuários após mudanças no Authentication
  PERFORM sync_auth_users();
  RETURN NULL;
END;
$$;

-- Criar trigger no auth.users (se possível)
-- Nota: Este trigger pode não funcionar dependendo das permissões
-- A sincronização será feita manualmente via função
DO $$
BEGIN
  -- Tentar criar trigger se possível
  BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_change ON auth.users;
    CREATE TRIGGER on_auth_user_change
      AFTER INSERT OR UPDATE OR DELETE ON auth.users
      FOR EACH STATEMENT
      EXECUTE FUNCTION handle_auth_user_change();
  EXCEPTION WHEN OTHERS THEN
    -- Ignorar erro se não tiver permissão para criar trigger em auth.users
    NULL;
  END;
END;
$$;

-- Executar sincronização inicial
SELECT sync_auth_users();

-- Função para buscar usuários do Authentication (para uso no cliente)
CREATE OR REPLACE FUNCTION get_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  updated_at timestamptz,
  user_metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta função permite ao cliente buscar usuários do Authentication
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.created_at,
    au.updated_at,
    au.user_metadata
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;

-- Política para permitir que admins vejam todos os usuários
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.auth_level = 'admin'
    )
  );

-- Política para permitir que admins atualizem usuários
CREATE POLICY "Admins can update users" ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.auth_level = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.auth_level = 'admin'
    )
  );

-- Política para permitir que admins insiram usuários
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.auth_level = 'admin'
    )
  );