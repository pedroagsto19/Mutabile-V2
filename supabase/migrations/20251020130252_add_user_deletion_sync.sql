/*
  # User Deletion Synchronization

  1. Overview
    - Adds bidirectional DELETE synchronization between auth.users and public.users
    - When a user is deleted from auth.users, automatically deletes from public.users
    - When a user is deleted from public.users, automatically deletes from auth.users
    
  2. Implementation
    - Creates function to handle auth.users deletion (cascades to public.users)
    - Creates function to handle public.users deletion (cascades to auth.users)
    - Both functions use SECURITY DEFINER to access auth schema
    
  3. Security
    - Functions run with elevated privileges to access auth schema
    - Only admin users can delete users (controlled by RLS policies)
    - Ensures data consistency across both tables
    
  4. Important Notes
    - Deletion is permanent and cannot be undone
    - All related data (projects, activities, etc.) will be affected by CASCADE rules
    - Admin users cannot delete themselves to prevent lockout
*/

-- Function to sync deletion from auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete corresponding record from public.users
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync deletion from public.users to auth.users
CREATE OR REPLACE FUNCTION public.handle_public_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete corresponding record from auth.users
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP TRIGGER IF EXISTS on_public_user_deleted ON public.users;

-- Create trigger on auth.users DELETE
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_deleted();

-- Create trigger on public.users DELETE
CREATE TRIGGER on_public_user_deleted
  BEFORE DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_public_user_deleted();

-- Add RLS policy to allow admins to delete users
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() != id AND -- Prevent self-deletion
    (SELECT auth_level FROM public.users WHERE id = auth.uid()) = 'admin'
  );