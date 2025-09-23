/*
  # Fix sync_auth_users function to handle duplicate keys

  1. Updates
    - Replace INSERT with ON CONFLICT DO UPDATE (upsert)
    - Handle duplicate key violations properly
    - Ensure idempotent synchronization

  2. Security
    - Maintains existing RLS policies
    - Preserves data integrity
*/

-- Drop and recreate the sync_auth_users function with proper upsert logic
DROP FUNCTION IF EXISTS sync_auth_users();

CREATE OR REPLACE FUNCTION sync_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert new users or update existing ones from auth.users
  INSERT INTO public.users (
    id,
    name,
    email,
    role,
    auth_level,
    team_id,
    manager_id,
    created_by,
    admin_user_id,
    created_at,
    updated_at
  )
  SELECT 
    au.id,
    COALESCE(
      (au.raw_user_meta_data->>'name')::text,
      split_part(au.email, '@', 1)
    ) as name,
    au.email,
    COALESCE(
      (au.raw_user_meta_data->>'role')::text,
      'Usuário do Sistema'
    ) as role,
    COALESCE(
      (au.raw_user_meta_data->>'auth_level')::text,
      'equipe'
    ) as auth_level,
    (au.raw_user_meta_data->>'team_id')::uuid as team_id,
    (au.raw_user_meta_data->>'manager_id')::uuid as manager_id,
    (au.raw_user_meta_data->>'created_by')::uuid as created_by,
    au.id as admin_user_id,
    au.created_at,
    COALESCE(au.updated_at, au.created_at)
  FROM auth.users au
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(
      (EXCLUDED.raw_user_meta_data->>'name')::text,
      split_part(EXCLUDED.email, '@', 1),
      users.name
    ),
    email = EXCLUDED.email,
    role = COALESCE(
      (EXCLUDED.raw_user_meta_data->>'role')::text,
      users.role
    ),
    auth_level = COALESCE(
      (EXCLUDED.raw_user_meta_data->>'auth_level')::text,
      users.auth_level
    ),
    team_id = COALESCE(
      (EXCLUDED.raw_user_meta_data->>'team_id')::uuid,
      users.team_id
    ),
    manager_id = COALESCE(
      (EXCLUDED.raw_user_meta_data->>'manager_id')::uuid,
      users.manager_id
    ),
    created_by = COALESCE(
      (EXCLUDED.raw_user_meta_data->>'created_by')::uuid,
      users.created_by
    ),
    updated_at = COALESCE(EXCLUDED.updated_at, EXCLUDED.created_at, NOW());

  -- Remove users that no longer exist in auth.users
  DELETE FROM public.users 
  WHERE id NOT IN (SELECT id FROM auth.users);
  
END;
$$;