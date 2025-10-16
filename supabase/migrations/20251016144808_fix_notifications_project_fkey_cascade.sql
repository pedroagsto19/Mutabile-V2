/*
  # Fix Notifications Foreign Key for Project Deletion

  1. Problem
    - The foreign key `notifications_related_project_id_fkey` has delete_rule 'NO ACTION'
    - This prevents project deletion when notifications reference the project
    - Error: "Key is still referenced from table notifications"

  2. Changes
    - Drop existing foreign key constraint
    - Recreate foreign key with ON DELETE SET NULL
    - This allows projects to be deleted while preserving notification history
    - The related_project_id will be set to NULL when a project is deleted

  3. Security
    - Maintains data integrity
    - Preserves notification history
    - Allows proper cleanup of projects
*/

-- Drop the existing foreign key constraint
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_related_project_id_fkey;

-- Recreate the foreign key with ON DELETE SET NULL
ALTER TABLE notifications
  ADD CONSTRAINT notifications_related_project_id_fkey
  FOREIGN KEY (related_project_id)
  REFERENCES projects(id)
  ON DELETE SET NULL;