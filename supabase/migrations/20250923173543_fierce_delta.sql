/*
  # Sincronização de usuários do Authentication com tabela users

  1. Função para sincronizar usuários
    - Cria trigger para sincronizar automaticamente usuários do auth.users
    - Atualiza tabela users quando usuário é criado/atualizado no Authentication
  
  2. Trigger automático
    - Executa sempre que um usuário é criado ou atualizado no auth.users
    - Mantém sincronização entre Authentication e tabela users
*/

-- Função para sincronizar usuários do auth.users para public.users
CREATE OR REPLACE FUNCTION sync_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar na tabela users
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
    name = COALESCE(NEW.raw_user_meta_data->>'name', EXCLUDED.name),
    email = NEW.email,
    role = COALESCE(NEW.raw_user_meta_data->>'role', EXCLUDED.role),
    auth_level = COALESCE(NEW.raw_user_meta_data->>'auth_level', EXCLUDED.auth_level),
    team_id = (NEW.raw_user_meta_data->>'team_id')::uuid,
    manager_id = (NEW.raw_user_meta_data->>'manager_id')::uuid,
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
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'Usuário do Sistema'),
  COALESCE(au.raw_user_meta_data->>'auth_level', 
    CASE 
      WHEN au.email LIKE '%admin%' THEN 'admin'
      WHEN au.email LIKE '%joao%' THEN 'gestor'
      ELSE 'equipe'
    END
  ),
  (au.raw_user_meta_data->>'team_id')::uuid,
  (au.raw_user_meta_data->>'manager_id')::uuid,
  (au.raw_user_meta_data->>'created_by')::uuid
FROM auth.users au
ON CONFLICT (admin_user_id) DO NOTHING;