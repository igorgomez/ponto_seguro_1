/*
  # Setup Admin User and Authentication

  1. Changes
    - Create initial admin user in auth.users
    - Create corresponding user in public.users table
    - Ensure proper linking between auth and public users

  2. Security
    - Uses secure password hashing
    - Maintains RLS policies
    - Ensures data consistency between auth and public tables
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to create admin user
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_email text := '00922256403@pontoseguro.local';
    v_cpf text := '00922256403';
BEGIN
    -- Create auth user if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        -- Generate UUID that will be used for both auth and public user
        v_user_id := uuid_generate_v4();
        
        -- Insert into auth.users
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
            v_user_id,
            '00000000-0000-0000-0000-000000000000'::uuid,
            v_email,
            crypt('igor1234', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            '{}'::jsonb,
            false,
            'authenticated'
        );

        -- Insert into public.users
        INSERT INTO public.users (
            id,
            cpf,
            name,
            user_type,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_cpf,
            'Administrador',
            'admin',
            NOW(),
            NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_admin_user();

-- Drop the function after use
DROP FUNCTION create_admin_user();