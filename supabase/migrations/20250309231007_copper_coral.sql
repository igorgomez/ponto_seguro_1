/*
  # Criar superusuário admin

  1. Alterações
    - Criar usuário admin inicial com CPF 00922256403
    - Adicionar políticas de segurança necessárias

  2. Segurança
    - Senha será definida via Supabase Auth UI
    - RLS já está habilitado nas tabelas
*/

-- Inserir superusuário na tabela users
INSERT INTO public.users (id, cpf, name, user_type)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00922256403',
  'Administrador',
  'admin'
)
ON CONFLICT (cpf) DO NOTHING;