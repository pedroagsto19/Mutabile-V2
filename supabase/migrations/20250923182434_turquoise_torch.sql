/*
  # Create sync_auth_users function

  1. Function
    - `sync_auth_users()` - Synchronizes users from auth.users to public.users table
    - Handles insert, update, and delete operations
    - Maps user metadata to appropriate columns
    - Provides fallback auth_level assignment based on email patterns

  2. Security
    - Function runs with SECURITY DEFINER to access auth schema
    - Maintains existing RLS policies on users table
*/

CREATE OR REPLACE FUNCTION public.sync_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert new users from auth.users into public.users
  INSERT INTO public.users (id, name, email, role, auth_level, team_id, manager_id, created_by, created_at, updated_at)
  SELECT
    au.id,
    COALESCE((au.raw_user_meta_data->>'name')::text, split_part(au.email, '@', 1)),
    au.email,
    COALESCE((au.raw_user_meta_data->>'role')::text, 'Usuário do Sistema'),
    COALESCE((au.raw_user_meta_data->>'auth_level')::text,
             CASE
               WHEN au.email LIKE '%admin%' THEN 'admin'
               WHEN au.email LIKE '%joao%' THEN 'gestor'
               ELSE 'equipe'
             END),
    (au.raw_user_meta_data->>'team_id')::uuid,
    (au.raw_user_meta_data->>'manager_id')::uuid,
    (au.raw_user_meta_data->>'created_by')::uuid,
    au.created_at,
    COALESCE(au.updated_at, au.created_at)
  FROM auth.users AS au
  LEFT JOIN public.users AS pu ON au.id = pu.id
  WHERE pu.id IS NULL;

  -- Update existing users in public.users
  UPDATE public.users AS pu
  SET
    name = COALESCE((au.raw_user_meta_data->>'name')::text, split_part(au.email, '@', 1), pu.name),
    email = au.email,
    role = COALESCE((au.raw_user_meta_data->>'role')::text, pu.role, 'Usuário do Sistema'),
    auth_level = COALESCE((au.raw_user_meta_data->>'auth_level')::text,
                          CASE
                            WHEN au.email LIKE '%admin%' THEN 'admin'
                            WHEN au.email LIKE '%joao%' THEN 'gestor'
                            ELSE 'equipe'
                          END, pu.auth_level),
    team_id = COALESCE((au.raw_user_meta_data->>'team_id')::uuid, pu.team_id),
    manager_id = COALESCE((au.raw_user_meta_data->>'manager_id')::uuid, pu.manager_id),
    created_by = COALESCE((au.raw_user_meta_data->>'created_by')::uuid, pu.created_by),
    updated_at = COALESCE(au.updated_at, au.created_at)
  FROM auth.users AS au
  WHERE pu.id = au.id
    AND (
      pu.name IS DISTINCT FROM COALESCE((au.raw_user_meta_data->>'name')::text, split_part(au.email, '@', 1)) OR
      pu.email IS DISTINCT FROM au.email OR
      pu.role IS DISTINCT FROM COALESCE((au.raw_user_meta_data->>'role')::text, 'Usuário do Sistema') OR
      pu.auth_level IS DISTINCT FROM COALESCE((au.raw_user_meta_data->>'auth_level')::text,
                                              CASE
                                                WHEN au.email LIKE '%admin%' THEN 'admin'
                                                WHEN au.email LIKE '%joao%' THEN 'gestor'
                                                ELSE 'equipe'
                                              END) OR
      pu.team_id IS DISTINCT FROM (au.raw_user_meta_data->>'team_id')::uuid OR
      pu.manager_id IS DISTINCT FROM (au.raw_user_meta_data->>'manager_id')::uuid OR
      pu.created_by IS DISTINCT FROM (au.raw_user_meta_data->>'created_by')::uuid OR
      pu.updated_at IS DISTINCT FROM COALESCE(au.updated_at, au.created_at)
    );

  -- Delete users from public.users that no longer exist in auth.users
  DELETE FROM public.users AS pu
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users AS au WHERE au.id = pu.id
  );
END;
$$;