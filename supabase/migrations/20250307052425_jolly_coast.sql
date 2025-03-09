/*
  # Initial Schema Setup for PontoSeguro

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `cpf` (text, unique)
      - `name` (text)
      - `user_type` (text, either 'admin' or 'employee')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `time_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `record_type` (text: 'entry' or 'exit')
      - `timestamp` (timestamp)
      - `created_at` (timestamp)
      - `location` (text, nullable)
      - `notes` (text, nullable)

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Admins can read all records
    - Employees can only read their own records
    - Employees can only create their own time records
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf text UNIQUE NOT NULL,
  name text NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('admin', 'employee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create time_records table
CREATE TABLE IF NOT EXISTS time_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  record_type text NOT NULL CHECK (record_type IN ('entry', 'exit')),
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  location text,
  notes text
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'user_type' = 'admin');

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policies for time_records table
CREATE POLICY "Admins can read all time records"
  ON time_records
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'user_type' = 'admin');

CREATE POLICY "Users can read own time records"
  ON time_records
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can create own time records"
  ON time_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );