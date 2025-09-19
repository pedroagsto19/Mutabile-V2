/*
  # Remover campo password_hash da tabela users

  1. Alterações
    - Remover coluna password_hash que não deve existir na tabela de perfil
    - Senhas são gerenciadas pelo Supabase Auth automaticamente
*/

-- Remover coluna password_hash se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users DROP COLUMN password_hash;
  END IF;
END $$;