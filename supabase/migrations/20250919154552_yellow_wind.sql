/*
  # Initialize demo data for Mutabile system

  1. Demo Users
    - Creates demo users in the users table (without passwords - handled by Supabase Auth)
    - Marina Costa (Admin)
    - Ana Silva (Gestor) 
    - Carlos Santos (Equipe)
    - João Oliveira (Leitor)

  2. Demo Clients
    - Creates sample clients with different funnel stages
    - Includes both CPF and CNPJ examples

  3. Demo Suppliers
    - Creates sample suppliers with ratings and locations
    - Includes Brazilian suppliers with proper state codes

  4. Demo Project
    - Creates a sample project with stages and activities
    - Includes checklist items for activities

  5. Demo Proposals and Commercial Activities
    - Creates sample proposals and commercial activities
    - Updates client total time spent

  Note: This migration only inserts data if it doesn't already exist (ON CONFLICT DO NOTHING)
*/

-- Inserir usuários demo (apenas se não existirem)
-- Note: Passwords are handled by Supabase Auth separately
INSERT INTO users (id, name, email, role, auth_level) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Marina Costa', 'marina@mutabile.com.br', 'Administradora', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Ana Silva', 'ana@mutabile.com.br', 'Gerente de Projetos', 'gestor'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Carlos Santos', 'carlos@mutabile.com.br', 'Arquiteto', 'equipe'),
  ('550e8400-e29b-41d4-a716-446655440004', 'João Oliveira', 'joao@mutabile.com.br', 'Consultor', 'leitor')
ON CONFLICT (email) DO NOTHING;

-- Inserir clientes demo
INSERT INTO clients (id, name, document, document_type, email, phone, street, number, complement, neighborhood, city, state, zip_code, funnel_stage, created_by) VALUES
  ('client_001', 'João e Maria Oliveira', '123.456.789-00', 'cpf', 'joao.oliveira@email.com', '(11) 99999-1234', 'Rua das Flores', '123', 'Apto 45', 'Jardins', 'São Paulo', 'SP', '01234-567', 'closed', '550e8400-e29b-41d4-a716-446655440002'),
  ('client_002', 'Construtora Delta Ltda', '12.345.678/0001-90', 'cnpj', 'contato@construtoredelta.com.br', '(21) 98888-5678', 'Av. Atlântica', '500', null, 'Copacabana', 'Rio de Janeiro', 'RJ', '22070-000', 'closed', '550e8400-e29b-41d4-a716-446655440002'),
  ('client_003', 'Família Santos', '987.654.321-00', 'cpf', 'familia.santos@gmail.com', '(31) 97777-9012', 'Rua das Palmeiras', '789', null, 'Savassi', 'Belo Horizonte', 'MG', '30112-000', 'negotiation', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (document) DO NOTHING;

-- Inserir fornecedores demo
INSERT INTO suppliers (id, name, cnpj, city, state, country, website, main_contact, description, observations, quality_rating, price_rating, recommendation_rating, created_by) VALUES
  ('supplier_001', 'Construtora Silva & Associados', '12.345.678/0001-90', 'São Paulo', 'SP', 'Brasil', 'https://silvaassociados.com.br', 'João Silva - (11) 99999-1234', 'Especializada em construção civil, reformas e acabamentos de alto padrão', 'Excelente qualidade, sempre cumpre prazos. Trabalha com materiais premium.', 5, 4, 5, '550e8400-e29b-41d4-a716-446655440002'),
  ('supplier_002', 'Marmoraria Pedra Nobre', '23.456.789/0001-01', 'Cachoeiro de Itapemirim', 'ES', 'Brasil', 'https://pedranobre.com.br', 'Maria Santos - (28) 98888-5678', 'Fornecimento e instalação de mármores, granitos e pedras naturais', 'Melhor preço da região. Entrega rápida e instalação impecável.', 5, 5, 5, '550e8400-e29b-41d4-a716-446655440002'),
  ('supplier_003', 'Elétrica Moderna Ltda', '34.567.890/0001-12', 'Rio de Janeiro', 'RJ', 'Brasil', 'https://eletricamoderna.com.br', 'Carlos Oliveira - (21) 97777-9012', 'Instalações elétricas residenciais e comerciais, automação predial', 'Equipe muito técnica. Ótimo para projetos complexos de automação.', 5, 3, 4, '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- Inserir projeto demo
INSERT INTO projects (id, name, client, location, responsible, control_number, description, status, progress, risk, next_deadline, created_by) VALUES
  ('project_001', 'Residência Jardins', 'João e Maria Oliveira', 'São Paulo, SP', 'Ana Silva', 'MUT-2025-001', 'Casa unifamiliar de alto padrão com 380m²', 'in_progress', 15, 'on_time', '2025-02-20T00:00:00Z', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- Inserir etapa demo
INSERT INTO stages (id, name, project_id, order_number, progress, status, notification_recipients, is_custom) VALUES
  ('stage_001', 'Anteprojeto', 'project_001', 1, 25, 'in_progress', ARRAY['ana@mutabile.com.br'], false)
ON CONFLICT (id) DO NOTHING;

-- Inserir atividade demo
INSERT INTO activities (id, title, description, responsible, priority, planned_start_date, planned_end_date, planned_duration, actual_duration, progress, status, stage_id, is_timer_active) VALUES
  ('activity_001', 'Levantamento do terreno', 'Análise topográfica e condições do local', 'Carlos Santos', 'high', '2025-01-15T08:00:00Z', '2025-01-20T18:00:00Z', 24, 8, 50, 'in_progress', 'stage_001', false)
ON CONFLICT (id) DO NOTHING;

-- Inserir itens de checklist demo
INSERT INTO checklist_items (id, activity_id, title, completed) VALUES
  ('check_001', 'activity_001', 'Levantamento topográfico', true),
  ('check_002', 'activity_001', 'Análise de orientação solar', false),
  ('check_003', 'activity_001', 'Estudo de ventos predominantes', false),
  ('check_004', 'activity_001', 'Análise do entorno e acessos', false)
ON CONFLICT (id) DO NOTHING;

-- Inserir atividades padrão
INSERT INTO default_activities (stage_name, title, description, planned_duration, priority, checklist_items, dependencies) VALUES
  ('Anteprojeto', 'Levantamento e análise do terreno', 'Análise topográfica, orientação solar, ventos predominantes e condições do local', 16, 'high', 
   '[{"id": "c1", "title": "Levantamento topográfico"}, {"id": "c2", "title": "Análise de orientação solar"}, {"id": "c3", "title": "Estudo de ventos predominantes"}, {"id": "c4", "title": "Análise do entorno e acessos"}]', 
   '[]'),
  ('Anteprojeto', 'Programa de necessidades', 'Definição detalhada dos ambientes, áreas e funcionalidades do projeto', 12, 'high',
   '[{"id": "c1", "title": "Entrevista com cliente"}, {"id": "c2", "title": "Definição de ambientes"}, {"id": "c3", "title": "Cálculo de áreas necessárias"}, {"id": "c4", "title": "Aprovação do programa"}]',
   '[]'),
  ('Anteprojeto', 'Estudo de viabilidade urbanística', 'Análise de zoneamento, recuos, taxa de ocupação e restrições legais', 8, 'high',
   '[{"id": "c1", "title": "Consulta ao zoneamento"}, {"id": "c2", "title": "Verificação de recuos obrigatórios"}, {"id": "c3", "title": "Cálculo de taxa de ocupação"}, {"id": "c4", "title": "Análise de restrições ambientais"}]',
   '[]'),
  ('Projeto Legal', 'Desenvolvimento de plantas baixas técnicas', 'Plantas baixas técnicas com cotas, especificações e detalhes para aprovação', 24, 'high',
   '[{"id": "c1", "title": "Plantas baixas cotadas"}, {"id": "c2", "title": "Especificação de materiais"}, {"id": "c3", "title": "Detalhes construtivos básicos"}, {"id": "c4", "title": "Revisão técnica"}]',
   '[]'),
  ('Projeto Legal', 'Cortes e fachadas', 'Desenvolvimento de cortes longitudinais, transversais e fachadas', 20, 'high',
   '[{"id": "c1", "title": "Cortes longitudinais e transversais"}, {"id": "c2", "title": "Fachadas principais"}, {"id": "c3", "title": "Indicação de materiais"}, {"id": "c4", "title": "Cotas de nível"}]',
   '[]'),
  ('Projeto Executivo', 'Detalhamento arquitetônico', 'Detalhamento completo de todos os elementos arquitetônicos', 32, 'high',
   '[{"id": "c1", "title": "Detalhes de esquadrias"}, {"id": "c2", "title": "Detalhes de acabamentos"}, {"id": "c3", "title": "Detalhes construtivos"}, {"id": "c4", "title": "Especificações técnicas"}]',
   '[]'),
  ('Planejamento', 'Definição de escopo e cronograma', 'Definição detalhada do escopo do projeto e cronograma de execução', 8, 'high',
   '[{"id": "c1", "title": "Definição do escopo detalhado"}, {"id": "c2", "title": "Cronograma macro"}, {"id": "c3", "title": "Marcos principais"}, {"id": "c4", "title": "Aprovação com cliente"}]',
   '[]')
ON CONFLICT (id) DO NOTHING;

-- Inserir propostas demo
INSERT INTO proposals (id, client_id, description, value, status, notes, created_by) VALUES
  ('proposal_001', 'client_001', 'Projeto arquitetônico residencial - Casa 380m²', 85000, 'accepted', 'Cliente interessado em projeto sustentável', '550e8400-e29b-41d4-a716-446655440002'),
  ('proposal_002', 'client_002', 'Projeto comercial - Edifício 12 andares', 450000, 'active', 'Projeto de grande porte, prazo apertado', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- Inserir atividades comerciais demo
INSERT INTO commercial_activities (id, client_id, type, description, time_spent, activity_date, notes, created_by) VALUES
  ('comm_001', 'client_001', 'meeting', 'Reunião inicial - apresentação da empresa', 2.0, '2024-12-01T14:00:00Z', 'Cliente demonstrou interesse, solicitou proposta', '550e8400-e29b-41d4-a716-446655440002'),
  ('comm_002', 'client_001', 'visit', 'Visita ao terreno para levantamento', 3.5, '2024-12-05T09:00:00Z', 'Terreno com boa orientação solar', '550e8400-e29b-41d4-a716-446655440002'),
  ('comm_003', 'client_002', 'call', 'Ligação para esclarecimentos sobre o projeto', 1.0, '2024-11-25T15:30:00Z', 'Cliente tem pressa para início do projeto', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- Atualizar tempo total gasto dos clientes
UPDATE clients SET total_time_spent = (
  SELECT COALESCE(SUM(time_spent), 0)
  FROM commercial_activities 
  WHERE client_id = clients.id
);