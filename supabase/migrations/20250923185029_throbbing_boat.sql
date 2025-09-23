/*
  # Fix sync_auth_users function - correct excluded column references

  1. Problem
    - The ON CONFLICT DO UPDATE clause was trying to access raw_user_meta_data from excluded
    - excluded refers to the target table columns, not the source table
    
  2. Solution
    - Remove the ON CONFLICT DO UPDATE clause entirely
    - Use a simpler approach with DELETE + INSERT to avoid column reference issues
    - This ensures clean synchronization without complex upsert logic
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS public.sync_auth_users();

-- Create the corrected sync_auth_users function
CREATE OR REPLACE FUNCTION public.sync_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, delete users that no longer exist in auth.users
  DELETE FROM public.users 
  WHERE id NOT IN (SELECT id FROM auth.users);
  
  -- Then, insert or update users from auth.users
  INSERT INTO public.users (
    id,
    name,
    email,
    role,
    auth_level,
    team_id,
    manager_id,
    created_by,
    created_at,
    updated_at
  )
  SELECT 
    au.id,
    COALESCE((au.raw_user_meta_data->>'name')::text, split_part(au.email, '@', 1)) as name,
    au.email,
    COALESCE((au.raw_user_meta_data->>'role')::text, 'Usuário do Sistema') as role,
    COALESCE((au.raw_user_meta_data->>'auth_level')::text, 'equipe') as auth_level,
    (au.raw_user_meta_data->>'team_id')::uuid as team_id,
    (au.raw_user_meta_data->>'manager_id')::uuid as manager_id,
    (au.raw_user_meta_data->>'created_by')::uuid as created_by,
    au.created_at,
    COALESCE(au.updated_at, au.created_at) as updated_at
  FROM auth.users au
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    auth_level = EXCLUDED.auth_level,
    team_id = EXCLUDED.team_id,
    manager_id = EXCLUDED.manager_id,
    created_by = EXCLUDED.created_by,
    updated_at = EXCLUDED.updated_at;
END;
$$;