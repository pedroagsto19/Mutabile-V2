/*
  # Add admin-user-id column with random UUID default

  1. Changes
    - Add `admin_user_id` column to `users` table
    - Set default value to `gen_random_uuid()`
    - Column is nullable to allow existing records

  2. Notes
    - Existing users will have NULL values initially
    - New users will automatically get a random UUID
    - Column can be updated manually if needed
*/

-- Add the admin-user-id column with random UUID default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'admin_user_id'
  ) THEN
    ALTER TABLE users ADD COLUMN admin_user_id uuid DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_admin_user_id ON users(admin_user_id);