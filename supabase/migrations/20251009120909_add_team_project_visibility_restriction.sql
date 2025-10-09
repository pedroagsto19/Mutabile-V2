/*
  # Restrict Project Visibility for Team Members

  1. Changes
    - Update SELECT policy to only show projects where 'equipe' users are the responsible
    - Admin and Gestor still see all projects
    
  2. Security
    - Team members (equipe) only see projects assigned to them
    - Based on matching `responsible` field with their name
*/

-- Drop existing read policy
DROP POLICY IF EXISTS "All users can read projects" ON projects;

-- CREATE NEW SELECT POLICY with restrictions for 'equipe' role
CREATE POLICY "Users can read assigned projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        -- Admin and Gestor can see all projects
        users.auth_level IN ('admin', 'gestor')
        OR
        -- Team members only see projects where they are responsible
        (users.auth_level = 'equipe' AND users.name = projects.responsible)
      )
    )
  );