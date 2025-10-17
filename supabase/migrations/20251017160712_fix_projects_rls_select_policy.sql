/*
  # Fix Projects RLS SELECT Policy

  ## Changes
  - Drop the restrictive SELECT policy for projects that only allowed:
    - Admins and gestores to see all projects
    - Equipe members to only see projects they're responsible for
  - Create a new permissive SELECT policy that allows all authenticated users to view all projects
  
  ## Rationale
  The original policy was too restrictive and prevented users from viewing projects.
  Permission control for editing and deleting projects is handled by separate UPDATE and DELETE policies.
  All authenticated users should be able to view the project list, with edit/delete controls
  enforced at the action level based on auth_level.

  ## Security
  - SELECT: All authenticated users can view all projects
  - INSERT: Only admin and gestor (existing policy)
  - UPDATE: Only admin and gestor (existing policy)
  - DELETE: Only admin (existing policy)
*/

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can read assigned projects" ON projects;

-- Create a new permissive SELECT policy for all authenticated users
CREATE POLICY "All authenticated users can view projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);
