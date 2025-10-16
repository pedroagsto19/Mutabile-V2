/*
  # Fix Notifications Activity Foreign Key for Cascade Deletion

  1. Problem
    - The foreign key `notifications_related_activity_id_fkey` has delete_rule 'NO ACTION'
    - This prevents activity deletion (and therefore project deletion) when notifications reference the activity
    - Error: "update or delete on table activities violates foreign key related_activity_id_fkey on table notifications"

  2. Changes
    - Drop existing foreign key constraint
    - Recreate foreign key with ON DELETE SET NULL
    - This allows activities (and projects) to be deleted while preserving notification history
    - The related_activity_id will be set to NULL when an activity is deleted

  3. Security
    - Maintains data integrity
    - Preserves notification history even after activities/projects are deleted
    - Allows proper cleanup of projects and their activities
*/

-- Drop the existing foreign key constraint
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_related_activity_id_fkey;

-- Recreate the foreign key with ON DELETE SET NULL
ALTER TABLE notifications
  ADD CONSTRAINT notifications_related_activity_id_fkey
  FOREIGN KEY (related_activity_id)
  REFERENCES activities(id)
  ON DELETE SET NULL;