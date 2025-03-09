/*
  # Criar superusuário admin

  1. Alterações
    - Criar usuário admin inicial com CPF 00922256403
    - Garantir que o ID do usuário corresponda ao ID do Auth
    - Adicionar políticas de segurança necessárias

  2. Segurança
    - RLS já está habilitado nas tabelas
    - Políticas existentes garantem acesso adequado
*/

-- Inserir superusuário na tabela users se ainda não existir
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Verificar se o usuário já existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = '00922256403@pontoseguro.local') THEN
    -- Criar usuário no auth.users
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
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
      '00922256403@pontoseguro.local',
      crypt('igor1234', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated'
    );

    -- Inserir na tabela users
    INSERT INTO public.users (
      id,
      cpf,
      name,
      user_type,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00922256403',
      'Administrador',
      'admin',
      NOW(),
      NOW()
    );
  END IF;
END $$;