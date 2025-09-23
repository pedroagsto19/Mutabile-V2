/*
  # Set admin@mutabile.com.br as admin level

  1. Updates
    - Update user with email admin@mutabile.com.br to have auth_level 'admin'
    - Only updates if the user exists in the users table

  2. Security
    - Uses safe UPDATE with WHERE clause to target specific user
    - No impact on other users
*/

-- Update the admin user to have admin auth level
UPDATE users 
SET 
  auth_level = 'admin',
  updated_at = now()
WHERE email = 'admin@mutabile.com.br';

-- Verify the update was successful (this will show in logs)
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count 
  FROM users 
  WHERE email = 'admin@mutabile.com.br' AND auth_level = 'admin';
  
  IF user_count > 0 THEN
    RAISE NOTICE 'Successfully updated admin@mutabile.com.br to admin level';
  ELSE
    RAISE NOTICE 'User admin@mutabile.com.br not found or update failed';
  END IF;
END $$;