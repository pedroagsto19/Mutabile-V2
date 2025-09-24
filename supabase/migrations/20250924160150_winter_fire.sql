/*
  # Fix auth user synchronization with proper constraints

  1. Database Changes
    - Add unique constraint for admin_user_id column
    - Create function to sync auth users to public.users table
    - Create trigger for automatic synchronization
    - Sync existing auth users

  2. Security
    - Function uses SECURITY DEFINER for proper permissions
    - Trigger handles INSERT and UPDATE operations
    - Proper conflict resolution with unique constraint
*/

-- First, ensure we have a unique constraint on admin_user_id
DO $$
BEGIN
  -- Check if unique constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_admin_user_id_key' 
    AND table_name = 'users'
  ) THEN
    -- Add unique constraint
    ALTER TABLE public.users ADD CONSTRAINT users_admin_user_id_key UNIQUE (admin_user_id);
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_admin_user_id ON public.users (admin_user_id);

-- Function to sync auth users to public.users
CREATE OR REPLACE FUNCTION sync_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update in users table
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

-- Create trigger for automatic synchronization
DROP TRIGGER IF EXISTS sync_auth_user_trigger ON auth.users;
CREATE TRIGGER sync_auth_user_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user();

-- Sync existing users from Authentication
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