/*
  # Fix Supplier Evaluations Foreign Key for Project Deletion

  1. Problem
    - The foreign key `supplier_evaluations_project_id_fkey` has delete_rule 'NO ACTION'
    - This prevents project deletion when supplier evaluations reference the project
    - Blocks proper project cleanup

  2. Changes
    - Drop existing foreign key constraint
    - Recreate foreign key with ON DELETE CASCADE
    - When a project is deleted, all related supplier evaluations are also deleted
    - This makes sense because evaluations are specific to a project

  3. Security
    - Maintains data integrity
    - Ensures proper cleanup of all project-related data
    - No orphaned supplier evaluation records
*/

-- Drop the existing foreign key constraint
ALTER TABLE supplier_evaluations 
  DROP CONSTRAINT IF EXISTS supplier_evaluations_project_id_fkey;

-- Recreate the foreign key with ON DELETE CASCADE
ALTER TABLE supplier_evaluations
  ADD CONSTRAINT supplier_evaluations_project_id_fkey
  FOREIGN KEY (project_id)
  REFERENCES projects(id)
  ON DELETE CASCADE;