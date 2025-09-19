/*
  # Limpeza completa de dados demo - manter apenas admin

  1. Limpeza de Dados
    - Remove TODOS os clientes demo
    - Remove TODOS os fornecedores demo  
    - Remove TODOS os projetos demo
    - Remove TODAS as propostas demo
    - Remove TODAS as atividades comerciais demo
    - Remove TODOS os usuários demo (exceto admin)
    - Remove TODAS as notificações demo
    - Remove TODAS as avaliações demo
    - Remove TODAS as atividades padrão demo

  2. Usuário Admin
    - Mantém apenas: admin@mutabile.com.br
    - Sistema limpo para dados reais
*/

-- Limpar todas as tabelas de dados (manter estrutura)
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

-- Garantir que o usuário admin existe com dados corretos
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
  'admin-user-id',
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
  team_id = EXCLUDED.team_id,
  manager_id = EXCLUDED.manager_id,
  created_by = EXCLUDED.created_by;