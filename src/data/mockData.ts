import type { Project, Stage, Activity, User } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Ana Silva',
    email: 'ana@mutabile.com.br',
    role: 'Gerente de Projetos'
  },
  {
    id: '2',
    name: 'Carlos Santos',
    email: 'carlos@mutabile.com.br',
    role: 'Arquiteto'
  },
  {
    id: '3',
    name: 'Marina Costa',
    email: 'marina@mutabile.com.br',
    role: 'Administradora'
  }
];

const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Levantamento do terreno',
    description: 'Análise topográfica e condições do local',
    responsible: 'Carlos Santos',
    priority: 'high',
    plannedStartDate: new Date('2025-01-15'),
    plannedEndDate: new Date('2025-01-20'),
    plannedDuration: 24,
    actualDuration: 0,
    progress: 0,
    status: 'not_started',
    stageId: '1',
    dependencies: [],
    isTimerActive: false
  },
  {
    id: '2',
    title: 'Estudo de viabilidade',
    description: 'Análise de zoneamento e restrições legais',
    responsible: 'Ana Silva',
    priority: 'medium',
    plannedStartDate: new Date('2025-01-21'),
    plannedEndDate: new Date('2025-01-25'),
    plannedDuration: 16,
    actualDuration: 0,
    progress: 0,
    status: 'not_started',
    stageId: '1',
    dependencies: [{ id: '1', dependsOn: '1', type: 'finish_start' }],
    isTimerActive: false
  }
];

const mockStages: Stage[] = [
  {
    id: '1',
    name: 'Anteprojeto',
    projectId: '1',
    order: 1,
    progress: 0,
    status: 'not_started',
    activities: mockActivities,
    notificationRecipients: ['ana@mutabile.com.br'],
    isCustom: false
  },
  {
    id: '2',
    name: 'Projeto Legal',
    projectId: '1',
    order: 2,
    progress: 0,
    status: 'not_started',
    activities: [],
    notificationRecipients: ['ana@mutabile.com.br'],
    isCustom: false
  },
  {
    id: '3',
    name: 'Projeto Executivo',
    projectId: '1',
    order: 3,
    progress: 0,
    status: 'not_started',
    activities: [],
    notificationRecipients: ['ana@mutabile.com.br'],
    isCustom: false
  }
];

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Residência Jardins',
    client: 'João e Maria Oliveira',
    location: 'São Paulo, SP',
    responsible: 'Ana Silva',
    controlNumber: 'MUT-2025-001',
    description: 'Casa unifamiliar de alto padrão com 380m²',
    status: 'in_progress',
    progress: 15,
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-12'),
    stages: mockStages,
    risk: 'on_time',
    nextDeadline: new Date('2025-01-20')
  },
  {
    id: '2',
    name: 'Edifício Comercial Centro',
    client: 'Construtora Delta',
    location: 'Rio de Janeiro, RJ',
    responsible: 'Carlos Santos',
    controlNumber: 'MUT-2025-002',
    description: 'Edifício comercial de 12 andares',
    status: 'planning',
    progress: 5,
    createdAt: new Date('2025-01-08'),
    updatedAt: new Date('2025-01-10'),
    stages: [],
    risk: 'on_time'
  }
];

export const defaultStages = [
  { name: 'Anteprojeto', isCustom: false },
  { name: 'Projeto Legal', isCustom: false },
  { name: 'Projeto Executivo', isCustom: false },
  { name: 'Planejamento', isCustom: false }
];