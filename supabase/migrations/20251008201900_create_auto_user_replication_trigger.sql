/*
  # Auto-Replication of Auth Users to Public Users Table
  
  1. Function Creation
    - Creates a trigger function that automatically replicates users from auth.users to public.users
    - Sets default auth_level to 'leitor' for all new users
    - Copies email and name from auth metadata
    
  2. Trigger Setup
    - Triggers on INSERT to auth.users
    - Automatically creates corresponding record in public.users
    
  3. Security
    - Function runs with SECURITY DEFINER to have permission to insert into public.users
    - Only triggers on new user creation
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
    'Usuário',
    'leitor',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
