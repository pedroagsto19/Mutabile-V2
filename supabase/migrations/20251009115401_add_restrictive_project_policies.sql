/*
  # Add Restrictive RLS Policies for Projects

  1. Problem
    - Current policies allow all authenticated users to INSERT/UPDATE/DELETE projects
    - This violates the principle of least privilege
    - Need to restrict based on user roles (admin, gestor, equipe)
    
  2. New Policies
    - SELECT: All authenticated users can read all projects
    - INSERT: Only admin and gestor can create projects
    - UPDATE: Only admin and gestor can update projects
    - DELETE: Only admin can delete projects
    
  3. Security
    - Projects remain read-only for 'equipe' role
    - Admin has full control
    - Gestor can create and edit but not delete
*/

-- Drop overly permissive existing policies
DROP POLICY IF EXISTS "Authenticated users can manage projects" ON projects;
DROP POLICY IF EXISTS "Users can read all projects" ON projects;

-- SELECT: All authenticated users can read all projects
CREATE POLICY "All users can read projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Only admin and gestor can create projects
CREATE POLICY "Admin and Gestor can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.auth_level IN ('admin', 'gestor')
    )
  );

-- UPDATE: Only admin and gestor can update projects
CREATE POLICY "Admin and Gestor can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.auth_level IN ('admin', 'gestor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.auth_level IN ('admin', 'gestor')
    )
  );

-- DELETE: Only admin can delete projects
CREATE POLICY "Only admin can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.auth_level = 'admin'
    )
  );