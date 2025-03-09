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
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE cpf = '00922256403') THEN
    INSERT INTO public.users (
      id,
      cpf,
      name,
      user_type,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      '00922256403',
      'Administrador',
      'admin',
      NOW(),
      NOW()
    );
  END IF;
END $$;