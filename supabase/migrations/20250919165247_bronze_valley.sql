/*
  # Limpeza completa de dados demo - manter apenas usuário admin

  1. Limpeza de Dados
    - Remove todos os clientes demo
    - Remove todos os fornecedores demo
    - Remove todos os projetos demo
    - Remove todas as propostas demo
    - Remove todas as atividades comerciais demo
    - Remove todas as notificações demo
    - Remove todos os usuários demo (exceto admin)
    - Remove todas as atividades padrão demo
    - Remove todas as avaliações de fornecedores demo

  2. Usuário Admin
    - Mantém apenas o usuário administrador para configuração inicial
    - Email: admin@mutabile.com.br
    - Senha: admin123
    - Nível: admin

  3. Estrutura
    - Mantém todas as tabelas e estruturas
    - Mantém todas as políticas RLS
    - Sistema pronto para dados reais
*/

-- Limpar todas as tabelas de dados (mantendo estrutura)
DELETE FROM drive_links;
DELETE FROM checklist_items;
DELETE FROM activity_dependencies;
DELETE FROM activities;
DELETE FROM stages;
DELETE FROM projects;
DELETE FROM supplier_evaluations;
DELETE FROM suppliers;
DELETE FROM commercial_activities;
DELETE FROM proposals;
DELETE FROM clients;
DELETE FROM notifications;
DELETE FROM notification_preferences;
DELETE FROM default_activities;

-- Limpar usuários (exceto admin)
DELETE FROM users WHERE email != 'admin@mutabile.com.br';

-- Garantir que o usuário admin existe com configurações corretas
INSERT INTO users (
  id,
  name,
  email,
  role,
  auth_level,
  team_id,
  manager_id,
  created_by
) VALUES (
  'admin-user-id-12345',
  'Administrador',
  'admin@mutabile.com.br',
  'Administrador do Sistema',
  'admin',
  NULL,
  NULL,
  NULL
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  auth_level = EXCLUDED.auth_level,
  updated_at = now();

-- Criar preferências de notificação para o admin
INSERT INTO notification_preferences (
  user_id,
  project_created,
  project_assigned,
  activity_assigned,
  email_notifications,
  sound_enabled
) VALUES (
  'admin-user-id-12345',
  true,
  true,
  true,
  false,
  true
) ON CONFLICT (user_id) DO UPDATE SET
  updated_at = now();

-- Inserir atividades padrão básicas para templates
INSERT INTO default_activities (stage_name, title, description, planned_duration, priority, checklist_items, drive_links, dependencies) VALUES
-- Anteprojeto
('Anteprojeto', 'Levantamento e análise do terreno', 'Análise topográfica, orientação solar, ventos predominantes e condições do local', 16, 'high', 
 '[{"id": "c1", "title": "Levantamento topográfico"}, {"id": "c2", "title": "Análise de orientação solar"}, {"id": "c3", "title": "Estudo de ventos predominantes"}, {"id": "c4", "title": "Análise do entorno e acessos"}]'::jsonb, 
 '[]'::jsonb, '[]'::jsonb),

('Anteprojeto', 'Programa de necessidades', 'Definição detalhada dos ambientes, áreas e funcionalidades do projeto', 12, 'high',
 '[{"id": "c1", "title": "Entrevista com cliente"}, {"id": "c2", "title": "Definição de ambientes"}, {"id": "c3", "title": "Cálculo de áreas necessárias"}, {"id": "c4", "title": "Aprovação do programa"}]'::jsonb,
 '[]'::jsonb, '[]'::jsonb),

('Anteprojeto', 'Estudo de viabilidade urbanística', 'Análise de zoneamento, recuos, taxa de ocupação e restrições legais', 8, 'high',
 '[{"id": "c1", "title": "Consulta ao zoneamento"}, {"id": "c2", "title": "Verificação de recuos obrigatórios"}, {"id": "c3", "title": "Cálculo de taxa de ocupação"}, {"id": "c4", "title": "Análise de restrições ambientais"}]'::jsonb,
 '[]'::jsonb, '[]'::jsonb),

-- Projeto Legal
('Projeto Legal', 'Desenvolvimento de plantas baixas técnicas', 'Plantas baixas técnicas com cotas, especificações e detalhes para aprovação', 24, 'high',
 '[{"id": "c1", "title": "Plantas baixas cotadas"}, {"id": "c2", "title": "Especificação de materiais"}, {"id": "c3", "title": "Detalhes construtivos básicos"}, {"id": "c4", "title": "Revisão técnica"}]'::jsonb,
 '[]'::jsonb, '[]'::jsonb),

('Projeto Legal', 'Cortes e fachadas', 'Desenvolvimento de cortes longitudinais, transversais e fachadas', 20, 'high',
 '[{"id": "c1", "title": "Cortes longitudinais e transversais"}, {"id": "c2", "title": "Fachadas principais"}, {"id": "c3", "title": "Indicação de materiais"}, {"id": "c4", "title": "Cotas de nível"}]'::jsonb,
 '[]'::jsonb, '[]'::jsonb),

-- Projeto Executivo
('Projeto Executivo', 'Detalhamento arquitetônico', 'Detalhamento completo de todos os elementos arquitetônicos', 32, 'high',
 '[{"id": "c1", "title": "Detalhes de esquadrias"}, {"id": "c2", "title": "Detalhes de acabamentos"}, {"id": "c3", "title": "Detalhes construtivos"}, {"id": "c4", "title": "Especificações técnicas"}]'::jsonb,
 '[]'::jsonb, '[]'::jsonb),

('Projeto Executivo', 'Compatibilização com projetos complementares', 'Compatibilização com estrutural, hidráulico, elétrico e outros', 20, 'high',
 '[{"id": "c1", "title": "Compatibilização estrutural"}, {"id": "c2", "title": "Compatibilização hidráulica"}, {"id": "c3", "title": "Compatibilização elétrica"}, {"id": "c4", "title": "Resolução de interferências"}]'::jsonb,
 '[]'::jsonb, '[]'::jsonb),

-- Planejamento
('Planejamento', 'Definição de escopo e cronograma', 'Definição detalhada do escopo do projeto e cronograma de execução', 8, 'high',
 '[{"id": "c1", "title": "Definição do escopo detalhado"}, {"id": "c2", "title": "Cronograma macro"}, {"id": "c3", "title": "Marcos principais"}, {"id": "c4", "title": "Aprovação com cliente"}]'::jsonb,
 '[]'::jsonb, '[]'::jsonb),

('Planejamento', 'Formação da equipe técnica', 'Seleção e contratação da equipe técnica necessária', 12, 'high',
 '[{"id": "c1", "title": "Definição de perfis necessários"}, {"id": "c2", "title": "Seleção de profissionais"}, {"id": "c3", "title": "Contratação da equipe"}, {"id": "c4", "title": "Kick-off do projeto"}]'::jsonb,
 '[]'::jsonb, '[]'::jsonb);