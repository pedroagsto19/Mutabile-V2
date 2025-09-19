/*
  # Limpeza de dados demo - manter apenas usuário admin

  1. Limpeza de dados
    - Remove todos os dados demo de todas as tabelas
    - Mantém apenas um usuário administrador para início
    - Reseta sequências e IDs se necessário

  2. Usuário mantido
    - Email: admin@mutabile.com.br
    - Senha: admin123
    - Nível: admin (Administrador)
    - Nome: Administrador Sistema

  3. Segurança
    - Mantém todas as políticas RLS
    - Preserva estrutura das tabelas
    - Não afeta configurações de autenticação
*/

-- Limpar dados de todas as tabelas (em ordem para respeitar foreign keys)
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

-- Limpar usuários, mas manter apenas o admin
DELETE FROM users WHERE email != 'admin@mutabile.com.br';

-- Garantir que existe o usuário admin (caso não exista)
INSERT INTO users (
  id,
  name,
  email,
  role,
  auth_level,
  team_id,
  manager_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  'admin-user-id-001',
  'Administrador Sistema',
  'admin@mutabile.com.br',
  'Administrador',
  'admin',
  NULL,
  NULL,
  NULL,
  now(),
  now()
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
  sound_enabled,
  created_at,
  updated_at
) VALUES (
  'admin-user-id-001',
  true,
  true,
  true,
  false,
  true,
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  updated_at = now();

-- Inserir algumas atividades padrão básicas para começar
INSERT INTO default_activities (
  stage_name,
  title,
  description,
  planned_duration,
  priority,
  checklist_items,
  drive_links,
  dependencies,
  created_at,
  updated_at
) VALUES 
-- Anteprojeto
(
  'Anteprojeto',
  'Levantamento do terreno',
  'Análise topográfica e condições do local',
  16,
  'high',
  '[
    {"id": "c1", "title": "Levantamento topográfico"},
    {"id": "c2", "title": "Análise de orientação solar"},
    {"id": "c3", "title": "Estudo de ventos predominantes"}
  ]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  now(),
  now()
),
(
  'Anteprojeto',
  'Programa de necessidades',
  'Definição detalhada dos ambientes e funcionalidades',
  12,
  'high',
  '[
    {"id": "c1", "title": "Entrevista com cliente"},
    {"id": "c2", "title": "Definição de ambientes"},
    {"id": "c3", "title": "Aprovação do programa"}
  ]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  now(),
  now()
),

-- Projeto Legal
(
  'Projeto Legal',
  'Plantas baixas técnicas',
  'Desenvolvimento de plantas baixas para aprovação',
  24,
  'high',
  '[
    {"id": "c1", "title": "Plantas baixas cotadas"},
    {"id": "c2", "title": "Especificação de materiais"},
    {"id": "c3", "title": "Revisão técnica"}
  ]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  now(),
  now()
),
(
  'Projeto Legal',
  'Cortes e fachadas',
  'Desenvolvimento de cortes e fachadas técnicas',
  20,
  'high',
  '[
    {"id": "c1", "title": "Cortes longitudinais e transversais"},
    {"id": "c2", "title": "Fachadas principais"},
    {"id": "c3", "title": "Cotas de nível"}
  ]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  now(),
  now()
),

-- Projeto Executivo
(
  'Projeto Executivo',
  'Detalhamento arquitetônico',
  'Detalhamento completo de elementos arquitetônicos',
  32,
  'high',
  '[
    {"id": "c1", "title": "Detalhes de esquadrias"},
    {"id": "c2", "title": "Detalhes de acabamentos"},
    {"id": "c3", "title": "Especificações técnicas"}
  ]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  now(),
  now()
);