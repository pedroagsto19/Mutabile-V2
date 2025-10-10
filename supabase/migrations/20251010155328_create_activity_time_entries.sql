/*
  # Create Activity Time Entries Table

  ## Overview
  This migration creates a system for tracking time spent on activities by individual users.
  Each user can start/stop/pause a timer, and all time entries are stored with their accumulated duration.

  ## New Tables
  - `activity_time_entries`
    - `id` (uuid, primary key) - Unique identifier for each time entry
    - `activity_id` (uuid, foreign key) - References the activity being tracked
    - `user_id` (uuid, foreign key) - References the user tracking time
    - `started_at` (timestamptz) - When the timer was started
    - `ended_at` (timestamptz, nullable) - When the timer was stopped (null if currently running)
    - `duration_seconds` (integer) - Total accumulated duration in seconds
    - `is_active` (boolean) - Whether this timer is currently running
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Record update timestamp

  ## Security
  - Enable RLS on activity_time_entries table
  - Users can view their own time entries
  - Users can create their own time entries
  - Users can update their own time entries
  - Admins and gestores can view all time entries for activities in their projects

  ## Indexes
  - Index on (activity_id, user_id) for fast lookups
  - Index on (user_id, is_active) for finding active timers
*/

-- Create activity_time_entries table
CREATE TABLE IF NOT EXISTS activity_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_activity_user ON activity_time_entries(activity_id, user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_active ON activity_time_entries(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_time_entries_activity ON activity_time_entries(activity_id);

-- Enable RLS
ALTER TABLE activity_time_entries ENABLE ROW LEVEL SECURITY;

-- Users can view their own time entries
CREATE POLICY "Users can view own time entries"
  ON activity_time_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own time entries
CREATE POLICY "Users can create own time entries"
  ON activity_time_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own time entries
CREATE POLICY "Users can update own time entries"
  ON activity_time_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins and gestores can view all time entries for their team/projects
CREATE POLICY "Admins and gestores can view team time entries"
  ON activity_time_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.auth_level IN ('admin', 'gestor')
    )
  );

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_activity_time_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_activity_time_entries_updated_at
  BEFORE UPDATE ON activity_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_time_entries_updated_at();