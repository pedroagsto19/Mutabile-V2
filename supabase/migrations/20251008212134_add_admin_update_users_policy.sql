/*
  # Add Admin Policy to Update Users
  
  1. Problem
    - Current RLS policies only allow users to update their own data
    - Administrators cannot update other users' information
    - This blocks the user management functionality
    
  2. Solution
    - Add a new policy that allows admins to update any user
    - Check for auth_level = 'admin' in the policy
    
  3. Security
    - Only users with auth_level = 'admin' can update other users
    - Uses auth.uid() to verify the current user's auth_level
    - Maintains security while enabling admin functionality
*/

-- Create policy for admins to update any user
CREATE POLICY "Admins can update any user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.auth_level = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.auth_level = 'admin'
    )
  );