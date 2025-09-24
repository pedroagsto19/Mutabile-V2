/*
  # Update admin user permission level

  1. Updates
    - Set auth_level to 'admin' for user with email admin@mutabile.com.br
    - Update the updated_at timestamp
  
  2. Verification
    - Confirms the update was successful
*/

-- Update the admin user's auth_level to 'admin'
UPDATE users 
SET 
  auth_level = 'admin',
  updated_at = now()
WHERE email = 'admin@mutabile.com.br';

-- Verify the update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE email = 'admin@mutabile.com.br' 
    AND auth_level = 'admin'
  ) THEN
    RAISE NOTICE 'Warning: User admin@mutabile.com.br not found or not updated to admin level';
  ELSE
    RAISE NOTICE 'Success: User admin@mutabile.com.br updated to admin level';
  END IF;
END $$;