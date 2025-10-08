/*
  # Fix User Replication Trigger to Handle Duplicates
  
  1. Problem
    - Current trigger fails when trying to insert a user with an email that already exists
    - Error: "duplicate key value violates unique constraint 'users_email_key'"
    
  2. Solution
    - Update the trigger function to handle conflicts gracefully
    - Use ON CONFLICT (email) DO UPDATE to update existing records instead of failing
    - This allows re-syncing users from auth.users without errors
    
  3. Changes
    - Drops and recreates the handle_new_user function with conflict handling
    - If a user with the same email exists, update the record instead of inserting
    - Updates the id to match auth.users.id (important for RLS policies)
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    name,
    email,
    role,
    auth_level,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'auth_level', 'leitor'),
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    name = COALESCE(EXCLUDED.name, users.name),
    role = COALESCE(EXCLUDED.role, users.role),
    auth_level = COALESCE(EXCLUDED.auth_level, users.auth_level),
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;