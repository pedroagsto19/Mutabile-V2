/*
  # Add 'inativo' to auth_level constraint

  1. Overview
    - Updates the auth_level check constraint to include 'inativo' as a valid value
    - This allows administrators to deactivate user accounts
    
  2. Changes
    - Drops existing users_auth_level_check constraint
    - Creates new constraint that includes: 'admin', 'gestor', 'equipe', 'leitor', 'inativo'
    
  3. Security
    - Inactive users will be blocked from accessing the system at the authentication layer
    - Only admin users can change user auth levels (controlled by RLS policies)
    
  4. Important Notes
    - Users with 'inativo' level cannot login
    - This provides a way to temporarily or permanently disable accounts without deletion
*/

-- Drop the existing check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_level_check;

-- Add new check constraint that includes 'inativo'
ALTER TABLE public.users ADD CONSTRAINT users_auth_level_check 
  CHECK (auth_level = ANY (ARRAY['admin'::text, 'gestor'::text, 'equipe'::text, 'leitor'::text, 'inativo'::text]));