/*
  # Add admin-user-id column with random UUID default

  1. New Columns
    - `admin_user_id` (uuid, nullable with random UUID default)
      - Provides a unique admin user identifier for each user
      - Uses gen_random_uuid() for automatic random UUID generation
      - Nullable to accommodate existing records

  2. Performance
    - Add index on admin_user_id for efficient queries

  3. Safety
    - Uses IF NOT EXISTS to prevent errors on re-runs
    - Preserves existing data
*/

-- Add admin_user_id column with random UUID default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'admin_user_id'
  ) THEN
    ALTER TABLE users ADD COLUMN admin_user_id uuid DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Add index for performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'idx_users_admin_user_id'
  ) THEN
    CREATE INDEX idx_users_admin_user_id ON users(admin_user_id);
  END IF;
END $$;