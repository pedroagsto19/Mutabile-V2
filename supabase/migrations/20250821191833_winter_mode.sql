/*
  # Sistema de Usuários e Autenticação

  1. Novas Tabelas
    - `users` - Dados dos usuários do sistema
      - `id` (uuid, primary key)
      - `name` (text, nome completo)
      - `email` (text, unique, email do usuário)
      - `role` (text, cargo/função)
      - `auth_level` (text, nível de autorização)
      - `password_hash` (text, senha criptografada)
      - `team_id` (uuid, ID da equipe)
      - `manager_id` (uuid, ID do gestor responsável)
      - `created_by` (uuid, ID do usuário que criou)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas baseadas em níveis de autorização
    - Função para hash de senhas
    - Função para verificação de senhas

  3. Dados Iniciais
    - Usuários de demonstração
    - Senhas criptografadas
*/

-- Extensão para criptografia de senhas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL,
  auth_level text NOT NULL CHECK (auth_level IN ('admin', 'gestor', 'equipe', 'leitor')),
  password_hash text NOT NULL,
  team_id uuid,
  manager_id uuid REFERENCES users(id),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_level ON users(auth_level);
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para hash de senhas
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar senhas
CREATE OR REPLACE FUNCTION verify_password(password text, hash text)
RETURNS boolean AS $$
BEGIN
  RETURN crypt(password, hash) = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para login
CREATE OR REPLACE FUNCTION authenticate_user(user_email text, user_password text)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  role text,
  auth_level text,
  team_id uuid,
  manager_id uuid,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.auth_level,
    u.team_id,
    u.manager_id,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.email = user_email 
    AND verify_password(user_password, u.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para admins (acesso total)
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND auth_level = 'admin'
    )
  );

-- Política para gestores (podem ver e editar sua equipe)
CREATE POLICY "Gestores can manage their team"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users manager
      WHERE manager.id = auth.uid() 
        AND manager.auth_level = 'gestor'
        AND (
          users.team_id = manager.team_id 
          OR users.manager_id = manager.id
        )
    )
  );

-- Política para usuários verem e editarem seus próprios dados
CREATE POLICY "Users can view and edit their own data"
  ON users
  FOR ALL
  TO authenticated
  USING (id = auth.uid());

-- Política para todos verem dados básicos dos usuários (para dropdowns, etc)
CREATE POLICY "All authenticated users can view basic user data"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Inserir usuários de demonstração
DO $$
DECLARE
  admin_id uuid;
  gestor_id uuid;
  team_uuid uuid := gen_random_uuid();
BEGIN
  -- Admin
  INSERT INTO users (id, name, email, role, auth_level, password_hash, team_id)
  VALUES (
    gen_random_uuid(),
    'Marina Costa',
    'marina@mutabile.com.br',
    'Administradora',
    'admin',
    hash_password('admin123'),
    team_uuid
  ) RETURNING id INTO admin_id;

  -- Gestor
  INSERT INTO users (id, name, email, role, auth_level, password_hash, team_id, created_by)
  VALUES (
    gen_random_uuid(),
    'Ana Silva',
    'ana@mutabile.com.br',
    'Gerente de Projetos',
    'gestor',
    hash_password('gestor123'),
    team_uuid,
    admin_id
  ) RETURNING id INTO gestor_id;

  -- Equipe
  INSERT INTO users (name, email, role, auth_level, password_hash, team_id, manager_id, created_by)
  VALUES 
    (
      'Carlos Santos',
      'carlos@mutabile.com.br',
      'Arquiteto',
      'equipe',
      hash_password('equipe123'),
      team_uuid,
      gestor_id,
      gestor_id
    ),
    (
      'Fernanda Lima',
      'fernanda@mutabile.com.br',
      'Engenheira Civil',
      'equipe',
      hash_password('equipe123'),
      team_uuid,
      gestor_id,
      gestor_id
    ),
    (
      'Roberto Silva',
      'roberto@mutabile.com.br',
      'Designer de Interiores',
      'equipe',
      hash_password('equipe123'),
      team_uuid,
      gestor_id,
      gestor_id
    );

  -- Leitor
  INSERT INTO users (name, email, role, auth_level, password_hash, team_id, created_by)
  VALUES (
    'João Oliveira',
    'joao@mutabile.com.br',
    'Cliente',
    'leitor',
    hash_password('leitor123'),
    team_uuid,
    gestor_id
  );
END $$;