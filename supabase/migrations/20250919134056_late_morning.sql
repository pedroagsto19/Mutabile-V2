/*
  # Schema completo do sistema Mutabile

  1. Novas Tabelas
    - `projects` - Projetos arquitetônicos
    - `stages` - Etapas dos projetos
    - `activities` - Atividades das etapas
    - `activity_dependencies` - Dependências entre atividades
    - `checklist_items` - Itens de checklist das atividades
    - `drive_links` - Links do Google Drive
    - `suppliers` - Fornecedores
    - `supplier_evaluations` - Avaliações de fornecedores
    - `clients` - Clientes
    - `proposals` - Propostas comerciais
    - `commercial_activities` - Atividades comerciais
    - `notifications` - Sistema de notificações
    - `notification_preferences` - Preferências de notificação
    - `default_activities` - Atividades padrão por etapa

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas baseadas em auth_level dos usuários
    - Controle de acesso granular

  3. Funcionalidades
    - Triggers para updated_at automático
    - Constraints para integridade dos dados
    - Índices para performance
*/

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client text NOT NULL,
  location text NOT NULL,
  responsible text NOT NULL,
  control_number text,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  risk text DEFAULT 'on_time' CHECK (risk IN ('on_time', 'at_risk', 'delayed')),
  next_deadline timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de etapas
CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  order_number integer NOT NULL DEFAULT 1,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  notification_recipients text[] DEFAULT '{}',
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de atividades
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  responsible text DEFAULT '',
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  planned_start_date timestamptz NOT NULL,
  planned_end_date timestamptz NOT NULL,
  actual_start_date timestamptz,
  actual_end_date timestamptz,
  planned_duration integer DEFAULT 8, -- horas
  actual_duration integer DEFAULT 0, -- horas
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  is_timer_active boolean DEFAULT false,
  timer_start_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de dependências entre atividades
CREATE TABLE IF NOT EXISTS activity_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  depends_on_activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  dependency_type text DEFAULT 'finish_start' CHECK (dependency_type IN ('finish_start', 'start_start', 'finish_finish', 'start_finish')),
  created_at timestamptz DEFAULT now()
);

-- Tabela de itens de checklist
CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tabela de links do Drive
CREATE TABLE IF NOT EXISTS drive_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text,
  city text,
  state text,
  country text DEFAULT 'Brasil',
  website text,
  main_contact text,
  description text,
  observations text,
  quality_rating integer DEFAULT 5 CHECK (quality_rating >= 1 AND quality_rating <= 5),
  price_rating integer DEFAULT 5 CHECK (price_rating >= 1 AND price_rating <= 5),
  recommendation_rating integer DEFAULT 5 CHECK (recommendation_rating >= 1 AND recommendation_rating <= 5),
  linked_projects uuid[] DEFAULT '{}',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de avaliações de fornecedores
CREATE TABLE IF NOT EXISTS supplier_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id),
  project_name text,
  evaluation_date timestamptz NOT NULL,
  quality_rating integer NOT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
  price_rating integer NOT NULL CHECK (price_rating >= 1 AND price_rating <= 5),
  recommendation_rating integer NOT NULL CHECK (recommendation_rating >= 1 AND recommendation_rating <= 5),
  notes text,
  evaluated_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('cpf', 'cnpj')),
  email text NOT NULL,
  phone text NOT NULL,
  street text NOT NULL,
  number text NOT NULL,
  complement text,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  funnel_stage text DEFAULT 'prospecting' CHECK (funnel_stage IN ('prospecting', 'proposal_sent', 'negotiation', 'closed', 'lost')),
  total_time_spent numeric DEFAULT 0,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de propostas
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  description text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'rejected', 'accepted')),
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de atividades comerciais
CREATE TABLE IF NOT EXISTS commercial_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('meeting', 'call', 'email', 'visit', 'other')),
  description text NOT NULL,
  time_spent numeric NOT NULL DEFAULT 0,
  activity_date timestamptz NOT NULL,
  notes text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('project_created', 'project_assigned', 'activity_assigned')),
  title text NOT NULL,
  message text NOT NULL,
  importance text DEFAULT 'normal' CHECK (importance IN ('normal', 'high', 'special')),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  is_fixed boolean DEFAULT false,
  related_project_id uuid REFERENCES projects(id),
  related_activity_id uuid REFERENCES activities(id),
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Tabela de preferências de notificação
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  project_created boolean DEFAULT true,
  project_assigned boolean DEFAULT true,
  activity_assigned boolean DEFAULT true,
  email_notifications boolean DEFAULT false,
  sound_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de atividades padrão
CREATE TABLE IF NOT EXISTS default_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_name text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  planned_duration integer DEFAULT 8,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  checklist_items jsonb DEFAULT '[]',
  drive_links jsonb DEFAULT '[]',
  dependencies jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_activities ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para projetos
CREATE POLICY "Users can read all projects" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and gestors can create projects" ON projects FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND auth_level IN ('admin', 'gestor')
    )
  );
CREATE POLICY "Admins and gestors can update projects" ON projects FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND auth_level IN ('admin', 'gestor')
    )
  );
CREATE POLICY "Admins can delete projects" ON projects FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND auth_level = 'admin'
    )
  );

-- Políticas RLS para etapas
CREATE POLICY "Users can read all stages" ON stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and gestors can manage stages" ON stages FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND auth_level IN ('admin', 'gestor')
    )
  );

-- Políticas RLS para atividades
CREATE POLICY "Users can read all activities" ON activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins, gestors and equipe can create activities" ON activities FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND auth_level IN ('admin', 'gestor', 'equipe')
    )
  );
CREATE POLICY "Users can update own activities or admins/gestors can update all" ON activities FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (
        auth_level IN ('admin', 'gestor') OR
        (auth_level = 'equipe' AND responsible = (SELECT name FROM users WHERE id = auth.uid()))
      )
    )
  );

-- Políticas RLS para dependências de atividades
CREATE POLICY "Users can read all activity dependencies" ON activity_dependencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and gestors can manage activity dependencies" ON activity_dependencies FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND auth_level IN ('admin', 'gestor')
    )
  );

-- Políticas RLS para checklist
CREATE POLICY "Users can read all checklist items" ON checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage checklist items" ON checklist_items FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas RLS para drive links
CREATE POLICY "Users can read all drive links" ON drive_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage drive links" ON drive_links FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas RLS para fornecedores
CREATE POLICY "Users can read all suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and gestors can manage suppliers" ON suppliers FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND auth_level IN ('admin', 'gestor')
    )
  );

-- Políticas RLS para avaliações de fornecedores
CREATE POLICY "Users can read all supplier evaluations" ON supplier_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create supplier evaluations" ON supplier_evaluations FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()
    )
  );

-- Políticas RLS para clientes
CREATE POLICY "Users can read all clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and gestors can manage clients" ON clients FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND auth_level IN ('admin', 'gestor')
    )
  );

-- Políticas RLS para propostas
CREATE POLICY "Users can read all proposals" ON proposals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and gestors can manage proposals" ON proposals FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND auth_level IN ('admin', 'gestor')
    )
  );

-- Políticas RLS para atividades comerciais
CREATE POLICY "Users can read all commercial activities" ON commercial_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and gestors can manage commercial activities" ON commercial_activities FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND auth_level IN ('admin', 'gestor')
    )
  );

-- Políticas RLS para notificações
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT TO authenticated 
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Políticas RLS para preferências de notificação
CREATE POLICY "Users can manage own notification preferences" ON notification_preferences FOR ALL TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas RLS para atividades padrão
CREATE POLICY "Users can read default activities" ON default_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage default activities" ON default_activities FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND auth_level = 'admin'
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stages_updated_at BEFORE UPDATE ON stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_default_activities_updated_at BEFORE UPDATE ON default_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_responsible ON projects(responsible);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_stages_project_id ON stages(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_stage_id ON activities(stage_id);
CREATE INDEX IF NOT EXISTS idx_activities_responsible ON activities(responsible);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activity_dependencies_activity_id ON activity_dependencies(activity_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_activity_id ON checklist_items(activity_id);
CREATE INDEX IF NOT EXISTS idx_drive_links_activity_id ON drive_links(activity_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_country ON suppliers(country);
CREATE INDEX IF NOT EXISTS idx_suppliers_state ON suppliers(state);
CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_supplier_id ON supplier_evaluations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_clients_funnel_stage ON clients(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_commercial_activities_client_id ON commercial_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_default_activities_stage_name ON default_activities(stage_name);

-- Constraints únicos
ALTER TABLE clients ADD CONSTRAINT unique_client_document UNIQUE (document);
ALTER TABLE clients ADD CONSTRAINT unique_client_email UNIQUE (email);
ALTER TABLE notification_preferences ADD CONSTRAINT unique_user_preferences UNIQUE (user_id);