/*
  # Inserir dados demo no Supabase

  1. Dados inseridos
    - Usuários demo com perfis completos
    - Clientes com diferentes estágios do funil
    - Fornecedores com avaliações
    - Projetos com etapas e atividades
    - Propostas comerciais
    - Atividades comerciais
    - Atividades padrão para templates

  2. Segurança
    - Todos os dados respeitam as políticas RLS existentes
    - IDs fixos para facilitar relacionamentos
    - Dados realistas para demonstração

  3. Observações
    - Os usuários demo precisam ser criados no Supabase Auth separadamente
    - Esta migração apenas cria os perfis na tabela users
*/

-- Inserir usuários demo (perfis apenas - auth será feito separadamente)
INSERT INTO users (id, name, email, role, auth_level, team_id, manager_id, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Marina Costa', 'marina@mutabile.com.br', 'Administradora', 'admin', null, null, null),
  ('550e8400-e29b-41d4-a716-446655440002', 'Ana Silva', 'ana@mutabile.com.br', 'Gerente de Projetos', 'gestor', null, null, '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Carlos Santos', 'carlos@mutabile.com.br', 'Arquiteto', 'equipe', null, '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440004', 'João Oliveira', 'joao@mutabile.com.br', 'Consultor', 'leitor', null, '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  auth_level = EXCLUDED.auth_level,
  team_id = EXCLUDED.team_id,
  manager_id = EXCLUDED.manager_id,
  updated_at = now();

-- Inserir clientes demo
INSERT INTO clients (id, name, document, document_type, email, phone, street, number, complement, neighborhood, city, state, zip_code, funnel_stage, total_time_spent, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440101', 'João e Maria Oliveira', '123.456.789-00', 'cpf', 'joao.oliveira@email.com', '(11) 99999-1234', 'Rua das Flores', '123', 'Apto 45', 'Jardins', 'São Paulo', 'SP', '01234-567', 'closed', 5.5, '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440102', 'Construtora Delta Ltda', '12.345.678/0001-90', 'cnpj', 'contato@construtoredelta.com.br', '(21) 98888-5678', 'Av. Atlântica', '500', null, 'Copacabana', 'Rio de Janeiro', 'RJ', '22070-000', 'closed', 1.0, '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440103', 'Família Santos', '987.654.321-00', 'cpf', 'familia.santos@gmail.com', '(31) 97777-9012', 'Rua das Palmeiras', '789', null, 'Savassi', 'Belo Horizonte', 'MG', '30112-000', 'negotiation', 0, '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440104', 'Empresa ABC Incorporações', '98.765.432/0001-10', 'cnpj', 'projetos@abcincorp.com.br', '(11) 96666-3456', 'Av. Paulista', '1000', 'Sala 1501', 'Bela Vista', 'São Paulo', 'SP', '01310-100', 'prospecting', 3.5, '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440105', 'Marina Costa Arquitetura', '45.678.901/0001-23', 'cnpj', 'marina@marinacosta.arq.br', '(41) 95555-7890', 'Rua XV de Novembro', '300', null, 'Centro', 'Curitiba', 'PR', '80020-310', 'lost', 6.0, '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (document) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  funnel_stage = EXCLUDED.funnel_stage,
  updated_at = now();

-- Inserir fornecedores demo
INSERT INTO suppliers (id, name, cnpj, city, state, country, website, main_contact, description, observations, quality_rating, price_rating, recommendation_rating, linked_projects, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440201', 'Construtora Silva & Associados', '12.345.678/0001-90', 'São Paulo', 'SP', 'Brasil', 'https://silvaassociados.com.br', 'João Silva - (11) 99999-1234', 'Especializada em construção civil, reformas e acabamentos de alto padrão', 'Excelente qualidade, sempre cumpre prazos. Trabalha com materiais premium.', 5, 4, 5, '{}', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440202', 'Marmoraria Pedra Nobre', '23.456.789/0001-01', 'Cachoeiro de Itapemirim', 'ES', 'Brasil', 'https://pedranobre.com.br', 'Maria Santos - (28) 98888-5678', 'Fornecimento e instalação de mármores, granitos e pedras naturais', 'Melhor preço da região. Entrega rápida e instalação impecável.', 5, 5, 5, '{}', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440203', 'Elétrica Moderna Ltda', '34.567.890/0001-12', 'Rio de Janeiro', 'RJ', 'Brasil', 'https://eletricamoderna.com.br', 'Carlos Oliveira - (21) 97777-9012', 'Instalações elétricas residenciais e comerciais, automação predial', 'Equipe muito técnica. Ótimo para projetos complexos de automação.', 5, 3, 4, '{}', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440204', 'Hidráulica Express', '45.678.901/0001-23', 'Belo Horizonte', 'MG', 'Brasil', null, 'Ana Costa - (31) 96666-3456', 'Serviços hidráulicos, instalação de tubulações e sistemas de água', 'Preço justo, mas às vezes atrasa um pouco. Qualidade boa.', 4, 4, 3, '{}', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440205', 'Vidraçaria Cristal', '56.789.012/0001-34', 'Curitiba', 'PR', 'Brasil', 'https://cristalvidros.com.br', 'Roberto Lima - (41) 95555-7890', 'Vidros temperados, laminados, espelhos e esquadrias de alumínio', 'Excelente para fachadas. Vidros de alta qualidade, mas preço elevado.', 5, 2, 4, '{}', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  observations = EXCLUDED.observations,
  updated_at = now();

-- Inserir projeto demo
INSERT INTO projects (id, name, client, location, responsible, control_number, description, status, progress, risk, next_deadline, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440301', 'Residência Jardins', 'João e Maria Oliveira', 'São Paulo, SP', 'Ana Silva', 'MUT-2025-001', 'Casa unifamiliar de alto padrão com 380m²', 'in_progress', 15, 'on_time', '2025-02-20T00:00:00Z', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440302', 'Edifício Comercial Centro', 'Construtora Delta Ltda', 'Rio de Janeiro, RJ', 'Carlos Santos', 'MUT-2025-002', 'Edifício comercial de 12 andares', 'planning', 5, 'on_time', '2025-03-15T00:00:00Z', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  progress = EXCLUDED.progress,
  updated_at = now();

-- Inserir etapas demo
INSERT INTO stages (id, name, project_id, order_number, progress, status, notification_recipients, is_custom) VALUES
  ('550e8400-e29b-41d4-a716-446655440401', 'Anteprojeto', '550e8400-e29b-41d4-a716-446655440301', 1, 25, 'in_progress', ARRAY['ana@mutabile.com.br'], false),
  ('550e8400-e29b-41d4-a716-446655440402', 'Projeto Legal', '550e8400-e29b-41d4-a716-446655440301', 2, 0, 'not_started', ARRAY['ana@mutabile.com.br'], false),
  ('550e8400-e29b-41d4-a716-446655440403', 'Planejamento', '550e8400-e29b-41d4-a716-446655440302', 1, 10, 'in_progress', ARRAY['carlos@mutabile.com.br'], false)
ON CONFLICT (id) DO UPDATE SET
  progress = EXCLUDED.progress,
  status = EXCLUDED.status,
  updated_at = now();

-- Inserir atividades demo
INSERT INTO activities (id, title, description, responsible, priority, planned_start_date, planned_end_date, planned_duration, actual_duration, progress, status, stage_id, is_timer_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440501', 'Levantamento do terreno', 'Análise topográfica e condições do local', 'Carlos Santos', 'high', '2025-01-15T08:00:00Z', '2025-01-20T18:00:00Z', 24, 8, 50, 'in_progress', '550e8400-e29b-41d4-a716-446655440401', false),
  ('550e8400-e29b-41d4-a716-446655440502', 'Estudo de viabilidade', 'Análise de zoneamento e restrições legais', 'Ana Silva', 'medium', '2025-01-21T08:00:00Z', '2025-01-25T18:00:00Z', 16, 0, 0, 'not_started', '550e8400-e29b-41d4-a716-446655440401', false),
  ('550e8400-e29b-41d4-a716-446655440503', 'Definição de escopo', 'Definição detalhada do escopo do projeto', 'Carlos Santos', 'high', '2025-01-10T08:00:00Z', '2025-01-12T18:00:00Z', 8, 6, 80, 'in_progress', '550e8400-e29b-41d4-a716-446655440403', false)
ON CONFLICT (id) DO UPDATE SET
  progress = EXCLUDED.progress,
  status = EXCLUDED.status,
  actual_duration = EXCLUDED.actual_duration,
  updated_at = now();

-- Inserir itens de checklist demo
INSERT INTO checklist_items (id, activity_id, title, completed) VALUES
  ('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440501', 'Levantamento topográfico', true),
  ('550e8400-e29b-41d4-a716-446655440602', '550e8400-e29b-41d4-a716-446655440501', 'Análise de orientação solar', true),
  ('550e8400-e29b-41d4-a716-446655440603', '550e8400-e29b-41d4-a716-446655440501', 'Estudo de ventos predominantes', false),
  ('550e8400-e29b-41d4-a716-446655440604', '550e8400-e29b-41d4-a716-446655440501', 'Análise do entorno e acessos', false),
  ('550e8400-e29b-41d4-a716-446655440605', '550e8400-e29b-41d4-a716-446655440502', 'Consulta ao zoneamento', false),
  ('550e8400-e29b-41d4-a716-446655440606', '550e8400-e29b-41d4-a716-446655440502', 'Verificação de recuos obrigatórios', false),
  ('550e8400-e29b-41d4-a716-446655440607', '550e8400-e29b-41d4-a716-446655440503', 'Definição do escopo detalhado', true),
  ('550e8400-e29b-41d4-a716-446655440608', '550e8400-e29b-41d4-a716-446655440503', 'Cronograma macro', true)
ON CONFLICT (id) DO UPDATE SET
  completed = EXCLUDED.completed;

-- Inserir links do Drive demo
INSERT INTO drive_links (id, activity_id, title, url, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440501', 'Template Levantamento', 'https://drive.google.com/file/d/exemplo1', 'Modelo para levantamento topográfico'),
  ('550e8400-e29b-41d4-a716-446655440702', '550e8400-e29b-41d4-a716-446655440502', 'Checklist Viabilidade', 'https://drive.google.com/file/d/exemplo2', 'Checklist para estudo de viabilidade')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  url = EXCLUDED.url,
  description = EXCLUDED.description;

-- Inserir propostas demo
INSERT INTO proposals (id, client_id, description, value, status, notes, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440801', '550e8400-e29b-41d4-a716-446655440101', 'Projeto arquitetônico residencial - Casa 380m²', 85000, 'accepted', 'Cliente interessado em projeto sustentável', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440802', '550e8400-e29b-41d4-a716-446655440102', 'Projeto comercial - Edifício 12 andares', 450000, 'accepted', 'Projeto de grande porte, prazo apertado', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440803', '550e8400-e29b-41d4-a716-446655440103', 'Reforma e ampliação residencial', 35000, 'active', 'Cliente em processo de decisão', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  value = EXCLUDED.value,
  status = EXCLUDED.status,
  updated_at = now();

-- Inserir atividades comerciais demo
INSERT INTO commercial_activities (id, client_id, type, description, time_spent, activity_date, notes, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440901', '550e8400-e29b-41d4-a716-446655440101', 'meeting', 'Reunião inicial - apresentação da empresa', 2.0, '2024-12-01T14:00:00Z', 'Cliente demonstrou interesse, solicitou proposta', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440902', '550e8400-e29b-41d4-a716-446655440101', 'visit', 'Visita ao terreno para levantamento', 3.5, '2024-12-05T09:00:00Z', 'Terreno com boa orientação solar', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440903', '550e8400-e29b-41d4-a716-446655440102', 'call', 'Ligação para esclarecimentos sobre o projeto', 1.0, '2024-11-25T15:30:00Z', 'Cliente tem pressa para início do projeto', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440904', '550e8400-e29b-41d4-a716-446655440104', 'email', 'Envio de material institucional', 0.5, '2024-12-20T10:00:00Z', 'Primeiro contato realizado', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  time_spent = EXCLUDED.time_spent,
  notes = EXCLUDED.notes;

-- Inserir atividades padrão para templates
INSERT INTO default_activities (stage_name, title, description, planned_duration, priority, checklist_items, drive_links, dependencies) VALUES
  ('Anteprojeto', 'Levantamento e análise do terreno', 'Análise topográfica, orientação solar, ventos predominantes e condições do local', 16, 'high', 
   '[{"id": "c1", "title": "Levantamento topográfico"}, {"id": "c2", "title": "Análise de orientação solar"}, {"id": "c3", "title": "Estudo de ventos predominantes"}, {"id": "c4", "title": "Análise do entorno e acessos"}]', 
   '[{"id": "d1", "title": "Template Levantamento", "url": "https://drive.google.com/file/d/exemplo1", "description": "Modelo para levantamento topográfico"}]',
   '[]'),
  ('Anteprojeto', 'Programa de necessidades', 'Definição detalhada dos ambientes, áreas e funcionalidades do projeto', 12, 'high',
   '[{"id": "c1", "title": "Entrevista com cliente"}, {"id": "c2", "title": "Definição de ambientes"}, {"id": "c3", "title": "Cálculo de áreas necessárias"}, {"id": "c4", "title": "Aprovação do programa"}]',
   '[]',
   '[]'),
  ('Anteprojeto', 'Estudo de viabilidade urbanística', 'Análise de zoneamento, recuos, taxa de ocupação e restrições legais', 8, 'high',
   '[{"id": "c1", "title": "Consulta ao zoneamento"}, {"id": "c2", "title": "Verificação de recuos obrigatórios"}, {"id": "c3", "title": "Cálculo de taxa de ocupação"}, {"id": "c4", "title": "Análise de restrições ambientais"}]',
   '[{"id": "d1", "title": "Checklist Viabilidade", "url": "https://drive.google.com/file/d/exemplo2", "description": "Checklist para estudo de viabilidade"}]',
   '[]'),
  ('Projeto Legal', 'Desenvolvimento de plantas baixas técnicas', 'Plantas baixas técnicas com cotas, especificações e detalhes para aprovação', 24, 'high',
   '[{"id": "c1", "title": "Plantas baixas cotadas"}, {"id": "c2", "title": "Especificação de materiais"}, {"id": "c3", "title": "Detalhes construtivos básicos"}, {"id": "c4", "title": "Revisão técnica"}]',
   '[]',
   '[]'),
  ('Projeto Legal', 'Cortes e fachadas', 'Desenvolvimento de cortes longitudinais, transversais e fachadas', 20, 'high',
   '[{"id": "c1", "title": "Cortes longitudinais e transversais"}, {"id": "c2", "title": "Fachadas principais"}, {"id": "c3", "title": "Indicação de materiais"}, {"id": "c4", "title": "Cotas de nível"}]',
   '[]',
   '[]'),
  ('Projeto Executivo', 'Detalhamento arquitetônico', 'Detalhamento completo de todos os elementos arquitetônicos', 32, 'high',
   '[{"id": "c1", "title": "Detalhes de esquadrias"}, {"id": "c2", "title": "Detalhes de acabamentos"}, {"id": "c3", "title": "Detalhes construtivos"}, {"id": "c4", "title": "Especificações técnicas"}]',
   '[]',
   '[]'),
  ('Planejamento', 'Definição de escopo e cronograma', 'Definição detalhada do escopo do projeto e cronograma de execução', 8, 'high',
   '[{"id": "c1", "title": "Definição do escopo detalhado"}, {"id": "c2", "title": "Cronograma macro"}, {"id": "c3", "title": "Marcos principais"}, {"id": "c4", "title": "Aprovação com cliente"}]',
   '[]',
   '[]')
ON CONFLICT (stage_name, title) DO UPDATE SET
  description = EXCLUDED.description,
  planned_duration = EXCLUDED.planned_duration,
  priority = EXCLUDED.priority,
  checklist_items = EXCLUDED.checklist_items,
  drive_links = EXCLUDED.drive_links,
  updated_at = now();

-- Inserir dependências de atividades
INSERT INTO activity_dependencies (activity_id, depends_on_activity_id, dependency_type) VALUES
  ('550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440501', 'finish_start')
ON CONFLICT (activity_id, depends_on_activity_id) DO NOTHING;

-- Inserir avaliações de fornecedores demo
INSERT INTO supplier_evaluations (supplier_id, project_id, project_name, evaluation_date, quality_rating, price_rating, recommendation_rating, notes, evaluated_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440301', 'Residência Jardins', '2024-12-15T00:00:00Z', 5, 4, 5, 'Excelente trabalho na fundação. Cumpriu todos os prazos.', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440301', 'Residência Jardins', '2024-12-10T00:00:00Z', 5, 5, 5, 'Mármores de excelente qualidade. Instalação perfeita.', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (supplier_id, project_id, evaluation_date) DO UPDATE SET
  quality_rating = EXCLUDED.quality_rating,
  price_rating = EXCLUDED.price_rating,
  recommendation_rating = EXCLUDED.recommendation_rating,
  notes = EXCLUDED.notes;

-- Inserir preferências de notificação para usuários demo
INSERT INTO notification_preferences (user_id, project_created, project_assigned, activity_assigned, email_notifications, sound_enabled) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', true, true, true, false, true),
  ('550e8400-e29b-41d4-a716-446655440002', true, true, true, false, true),
  ('550e8400-e29b-41d4-a716-446655440003', false, true, true, false, true),
  ('550e8400-e29b-41d4-a716-446655440004', false, false, false, false, false)
ON CONFLICT (user_id) DO UPDATE SET
  project_created = EXCLUDED.project_created,
  project_assigned = EXCLUDED.project_assigned,
  activity_assigned = EXCLUDED.activity_assigned,
  email_notifications = EXCLUDED.email_notifications,
  sound_enabled = EXCLUDED.sound_enabled,
  updated_at = now();

-- Atualizar tempo total gasto dos clientes baseado nas atividades comerciais
UPDATE clients SET total_time_spent = (
  SELECT COALESCE(SUM(time_spent), 0)
  FROM commercial_activities 
  WHERE client_id = clients.id
);

-- Atualizar progresso das etapas baseado nas atividades
UPDATE stages SET progress = (
  SELECT COALESCE(AVG(progress), 0)
  FROM activities 
  WHERE stage_id = stages.id
);

-- Atualizar progresso dos projetos baseado nas etapas
UPDATE projects SET progress = (
  SELECT COALESCE(AVG(progress), 0)
  FROM stages 
  WHERE project_id = projects.id
);