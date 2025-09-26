/*
  # User synchronization between auth.users and public.users

  1. Functions
    - Create sync_auth_user() function to automatically sync user data
    - Handle user creation and updates from Authentication to public users table

  2. Triggers
    - Create trigger to automatically sync when auth.users changes
    - Ensures data consistency between Authentication and application users

  3. Data Migration
    - Sync existing users from Authentication to public.users table
    - Handle conflicts gracefully using the unique constraint on admin_user_id

  4. Security
    - Function uses SECURITY DEFINER for proper permissions
    - Maintains data integrity between auth and public schemas
*/

-- Função para sincronizar usuários do auth.users para public.users
CREATE OR REPLACE FUNCTION sync_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar na tabela users usando a constraint única existente
  INSERT INTO public.users (
    admin_user_id,
    name,
    email,
    role,
    auth_level,
    team_id,
    manager_id,
    created_by
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Usuário do Sistema'),
    COALESCE(NEW.raw_user_meta_data->>'auth_level', 'equipe'),
    (NEW.raw_user_meta_data->>'team_id')::uuid,
    (NEW.raw_user_meta_data->>'manager_id')::uuid,
    (NEW.raw_user_meta_data->>'created_by')::uuid
  )
  ON CONFLICT (admin_user_id) 
  DO UPDATE SET
    name = COALESCE(NEW.raw_user_meta_data->>'name', users.name),
    email = NEW.email,
    role = COALESCE(NEW.raw_user_meta_data->>'role', users.role),
    auth_level = COALESCE(NEW.raw_user_meta_data->>'auth_level', users.auth_level),
    team_id = COALESCE((NEW.raw_user_meta_data->>'team_id')::uuid, users.team_id),
    manager_id = COALESCE((NEW.raw_user_meta_data->>'manager_id')::uuid, users.manager_id),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar automaticamente
DROP TRIGGER IF EXISTS sync_auth_user_trigger ON auth.users;
CREATE TRIGGER sync_auth_user_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user();

-- Sincronizar usuários existentes do Authentication
-- Usar DO block para tratar conflitos de forma mais robusta
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data,
      au.created_at
    FROM auth.users au
  LOOP
    -- Inserir apenas se não existir
    INSERT INTO public.users (
      admin_user_id,
      name,
      email,
      role,
      auth_level,
      team_id,
      manager_id,
      created_by
    )
    SELECT 
      auth_user.id,
      COALESCE(auth_user.raw_user_meta_data->>'name', split_part(auth_user.email, '@', 1)),
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'role', 'Usuário do Sistema'),
      COALESCE(auth_user.raw_user_meta_data->>'auth_level', 
        CASE 
          WHEN auth_user.email LIKE '%admin%' THEN 'admin'
          WHEN auth_user.email LIKE '%joao%' THEN 'gestor'
          ELSE 'equipe'
        END
      ),
      (auth_user.raw_user_meta_data->>'team_id')::uuid,
      (auth_user.raw_user_meta_data->>'manager_id')::uuid,
      (auth_user.raw_user_meta_data->>'created_by')::uuid
    WHERE NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE admin_user_id = auth_user.id
    );
  END LOOP;
END $$;