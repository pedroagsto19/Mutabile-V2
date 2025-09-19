/*
  # Atualizar políticas RLS para permitir inicialização de dados demo

  1. Políticas atualizadas
    - Permitir inserção de dados demo para usuários autenticados
    - Manter segurança para operações normais
    - Facilitar inicialização do sistema

  2. Tabelas afetadas
    - clients, suppliers, projects, stages, activities
    - checklist_items, drive_links, activity_dependencies
    - default_activities
*/

-- Atualizar política para clientes
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON clients;
CREATE POLICY "Authenticated users can manage clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar política para fornecedores
DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON suppliers;
CREATE POLICY "Authenticated users can manage suppliers"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar política para projetos
DROP POLICY IF EXISTS "Authenticated users can manage projects" ON projects;
CREATE POLICY "Authenticated users can manage projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar política para etapas
DROP POLICY IF EXISTS "Authenticated users can manage stages" ON stages;
CREATE POLICY "Authenticated users can manage stages"
  ON stages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar política para atividades
DROP POLICY IF EXISTS "Authenticated users can manage activities" ON activities;
CREATE POLICY "Authenticated users can manage activities"
  ON activities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar política para itens de checklist
DROP POLICY IF EXISTS "Users can manage checklist items" ON checklist_items;
CREATE POLICY "Users can manage checklist items"
  ON checklist_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar política para links do drive
DROP POLICY IF EXISTS "Users can manage drive links" ON drive_links;
CREATE POLICY "Users can manage drive links"
  ON drive_links
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar política para dependências de atividades
DROP POLICY IF EXISTS "Authenticated users can manage activity dependencies" ON activity_dependencies;
CREATE POLICY "Authenticated users can manage activity dependencies"
  ON activity_dependencies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar política para atividades padrão
DROP POLICY IF EXISTS "Authenticated users can manage default activities" ON default_activities;
CREATE POLICY "Authenticated users can manage default activities"
  ON default_activities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);