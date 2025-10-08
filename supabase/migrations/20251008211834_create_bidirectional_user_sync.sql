/*
  # Bidirectional User Synchronization
  
  1. Problem
    - Changes to public.users table don't sync back to auth.users metadata
    - When admins update permissions in UI, it updates public.users only
    - This means auth.users.raw_user_meta_data becomes out of sync
    
  2. Solution
    - Create a trigger that syncs public.users changes back to auth.users
    - Update raw_user_meta_data whenever public.users is updated
    - This ensures both tables stay in sync
    
  3. Implementation
    - Creates function to update auth.users metadata
    - Triggers on UPDATE of public.users
    - Syncs name, role, and auth_level fields
    
  4. Security
    - Function runs with SECURITY DEFINER to access auth schema
    - Only updates metadata fields, not core auth data
*/

-- Function to sync public.users changes back to auth.users
CREATE OR REPLACE FUNCTION public.sync_user_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users raw_user_meta_data with the new values
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{name}',
        to_jsonb(NEW.name)
      ),
      '{role}',
      to_jsonb(NEW.role)
    ),
    '{auth_level}',
    to_jsonb(NEW.auth_level)
  ),
  updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_updated ON public.users;

-- Create trigger on public.users UPDATE
CREATE TRIGGER on_user_updated
  AFTER UPDATE ON public.users
  FOR EACH ROW
  WHEN (
    OLD.name IS DISTINCT FROM NEW.name OR
    OLD.role IS DISTINCT FROM NEW.role OR
    OLD.auth_level IS DISTINCT FROM NEW.auth_level
  )
  EXECUTE FUNCTION public.sync_user_to_auth();