/*
  # Fix clients created_by foreign key constraint

  1. Changes
    - Drop existing foreign key constraint `clients_created_by_fkey`
    - Recreate constraint with `ON DELETE SET NULL` to prevent deletion conflicts
    - Ensure `created_by` column allows NULL values

  2. Security
    - Maintains referential integrity while allowing user deletion
    - Sets `created_by` to NULL when referenced user is deleted
*/

-- Ensure the created_by column allows NULL values
ALTER TABLE clients ALTER COLUMN created_by DROP NOT NULL;

-- Drop the existing foreign key constraint
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_created_by_fkey;

-- Recreate the foreign key constraint with ON DELETE SET NULL
ALTER TABLE clients ADD CONSTRAINT clients_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;