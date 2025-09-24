/*
  # Fix foreign key constraint for projects.created_by

  1. Changes
    - Drop existing foreign key constraint `projects_created_by_fkey`
    - Recreate constraint with `ON DELETE SET NULL` to allow user deletion
    - Ensure `created_by` column allows NULL values

  This resolves the foreign key constraint violation that prevents user synchronization
  when users referenced by projects are deleted from the authentication system.
*/

-- First, ensure the created_by column allows NULL values
ALTER TABLE projects ALTER COLUMN created_by DROP NOT NULL;

-- Drop the existing foreign key constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

-- Recreate the foreign key constraint with ON DELETE SET NULL
ALTER TABLE projects 
ADD CONSTRAINT projects_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES users(id) 
ON DELETE SET NULL;