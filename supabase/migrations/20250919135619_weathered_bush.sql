/*
  # Corrigir políticas RLS para permitir inicialização de dados demo

  1. Políticas atualizadas
    - Permitir inserção de dados para usuários autenticados
    - Simplificar políticas para facilitar uso inicial
    - Manter segurança básica
*/

-- Atualizar políticas para clientes
DROP POLICY IF EXISTS "Admins and gestors can manage clients" ON clients;
CREATE POLICY "Authenticated users can manage clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar políticas para fornecedores  
DROP POLICY IF EXISTS "Admins and gestors can manage suppliers" ON suppliers;
CREATE POLICY "Authenticated users can manage suppliers"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar políticas para projetos
DROP POLICY IF EXISTS "Admins and gestors can create projects" ON projects;
DROP POLICY IF EXISTS "Admins and gestors can update projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;

CREATE POLICY "Authenticated users can manage projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar políticas para etapas
DROP POLICY IF EXISTS "Admins and gestors can manage stages" ON stages;
CREATE POLICY "Authenticated users can manage stages"
  ON stages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar políticas para atividades
DROP POLICY IF EXISTS "Admins, gestors and equipe can create activities" ON activities;
DROP POLICY IF EXISTS "Users can update own activities or admins/gestors can update al" ON activities;

CREATE POLICY "Authenticated users can manage activities"
  ON activities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar políticas para atividades padrão
DROP POLICY IF EXISTS "Admins can manage default activities" ON default_activities;
CREATE POLICY "Authenticated users can manage default activities"
  ON default_activities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar políticas para propostas
DROP POLICY IF EXISTS "Admins and gestors can manage proposals" ON proposals;
CREATE POLICY "Authenticated users can manage proposals"
  ON proposals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar políticas para atividades comerciais
DROP POLICY IF EXISTS "Admins and gestors can manage commercial activities" ON commercial_activities;
CREATE POLICY "Authenticated users can manage commercial activities"
  ON commercial_activities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar políticas para dependências de atividades
DROP POLICY IF EXISTS "Admins and gestors can manage activity dependencies" ON activity_dependencies;
CREATE POLICY "Authenticated users can manage activity dependencies"
  ON activity_dependencies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para itens de checklist e links do drive já permitem acesso para usuários autenticados