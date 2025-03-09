/*
  # Fix Admin User Setup

  1. Changes
    - Drop and recreate admin user with correct password hashing
    - Ensure proper linking between auth and public users
    - Use Supabase's password hashing method

  2. Security
    - Uses Supabase's secure password hashing
    - Maintains data consistency between auth and public tables
*/

-- First, clean up any existing admin user to avoid conflicts
DELETE FROM auth.users WHERE email = '00922256403@pontoseguro.local';
DELETE FROM public.users WHERE cpf = '00922256403';

-- Create the admin user in auth.users with proper password hashing
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00922256403@pontoseguro.local',
  -- Using Supabase's default password hashing method (scrypt)
  crypt('igor1234', gen_salt('bf', 10)),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  'authenticated'
);

-- Create corresponding user in public.users
INSERT INTO public.users (
  id,
  cpf,
  name,
  user_type,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00922256403',
  'Administrador',
  'admin',
  NOW(),
  NOW()
);