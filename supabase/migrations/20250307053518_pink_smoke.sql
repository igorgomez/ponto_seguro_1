/*
  # Criar superusuário admin

  1. Operações
    - Criar usuário admin com CPF e senha específicos
    - Habilitar autenticação por email usando CPF como email
    - Inserir dados do usuário na tabela users

  2. Detalhes do Usuário
    - CPF: 00922256403
    - Nome: Administrador
    - Tipo: admin
*/

-- Criar usuário na auth.users se não existir
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Gerar novo UUID para o usuário
  new_user_id := gen_random_uuid();
  
  -- Inserir na auth.users apenas se o email não existir
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = '00922256403@pontoseguro.local'
  ) THEN
    INSERT INTO auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      new_user_id,
      'authenticated',
      'authenticated',
      '00922256403@pontoseguro.local',
      crypt('igor1234', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}'
    );
  END IF;

  -- Inserir na public.users apenas se o CPF não existir
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE cpf = '00922256403'
  ) THEN
    INSERT INTO public.users (
      id,
      cpf,
      name,
      user_type,
      created_at,
      updated_at
    ) VALUES (
      COALESCE(
        (SELECT id FROM auth.users WHERE email = '00922256403@pontoseguro.local'),
        new_user_id
      ),
      '00922256403',
      'Administrador',
      'admin',
      now(),
      now()
    );
  END IF;
END $$;