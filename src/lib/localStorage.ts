// Sistema de armazenamento local
export interface LocalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  authLevel: 'admin' | 'gestor' | 'equipe' | 'leitor';
  passwordHash: string;
  teamId?: string;
  managerId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalProject {
  id: string;
  name: string;
  client: string;
  location: string;
  responsible: string;
  controlNumber: string;
  description: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  progress: number;
  risk: 'on_time' | 'at_risk' | 'delayed';
  nextDeadline?: string;
  stages: any[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalActivity {
  id: string;
  title: string;
  description: string;
  responsible: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  plannedDuration: number;
  actualDuration: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  stageId: string;
  dependencies: any[];
  isTimerActive: boolean;
  timerStartTime?: string;
  checklist: Array<{
    id: string;
    title: string;
    completed: boolean;
    createdAt: string;
  }>;
}

export interface LocalStage {
  id: string;
  name: string;
  projectId: string;
  order: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  activities: LocalActivity[];
  notificationRecipients: string[];
  isCustom: boolean;
}
// Função simples para hash de senha (apenas para demo local)
function simpleHash(password: string): string {
  if (!password) return '';
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString();
}

// Função para verificar senha
function verifyPassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  const computedHash = simpleHash(password);
  console.log('Verifying password:', { password, hash, computedHash, match: computedHash === hash });
  return computedHash === hash;
}

class LocalStorage {
  private static USERS_KEY = 'mutabile_users';
  private static PROJECTS_KEY = 'mutabile_projects';
  private static CURRENT_USER_KEY = 'mutabile_current_user';

  // Inicializar dados padrão se não existirem
  static initializeDefaultData() {
    try {
      // Always clear and reinitialize for demo purposes
      localStorage.removeItem(this.USERS_KEY);
      localStorage.removeItem(this.PROJECTS_KEY);
      localStorage.removeItem(this.CURRENT_USER_KEY);
      
      if (!localStorage.getItem(this.USERS_KEY)) {
        const defaultUsers: LocalUser[] = [
          {
            id: '1',
            name: 'Marina Costa',
            email: 'marina@mutabile.com.br',
            role: 'Administradora',
            authLevel: 'admin',
            passwordHash: simpleHash('admin123'),
            teamId: 'team1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Ana Silva',
            email: 'ana@mutabile.com.br',
            role: 'Gerente de Projetos',
            authLevel: 'gestor',
            passwordHash: simpleHash('gestor123'),
            teamId: 'team1',
            createdBy: '1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Carlos Santos',
            email: 'carlos@mutabile.com.br',
            role: 'Arquiteto',
            authLevel: 'equipe',
            passwordHash: simpleHash('equipe123'),
            teamId: 'team1',
            managerId: '2',
            createdBy: '2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '4',
            name: 'João Oliveira',
            email: 'joao@mutabile.com.br',
            role: 'Cliente',
            authLevel: 'leitor',
            passwordHash: simpleHash('leitor123'),
            teamId: 'team1',
            createdBy: '2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        console.log('Initializing default users:', defaultUsers.map(u => ({ 
          email: u.email, 
          authLevel: u.authLevel,
          passwordHash: u.passwordHash 
        })));
        
        localStorage.setItem(this.USERS_KEY, JSON.stringify(defaultUsers));
      }

      if (!localStorage.getItem(this.PROJECTS_KEY)) {
        const sampleActivities: LocalActivity[] = [
          {
            id: 'act1',
            title: 'Levantamento topográfico',
            description: 'Análise detalhada das condições do terreno, medições e levantamento planialtimétrico',
            responsible: 'Carlos Santos',
            priority: 'high',
            plannedStartDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            plannedEndDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
            plannedDuration: 32,
            actualDuration: 18,
            progress: 75,
            status: 'in_progress',
            stageId: 'stage1',
            dependencies: [],
            isTimerActive: false,
            actualStartDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            checklist: [
              {
                id: 'check1',
                title: 'Solicitar certidão de inteiro teor',
                completed: true,
                createdAt: new Date().toISOString()
              },
              {
                id: 'check2',
                title: 'Realizar medições in loco',
                completed: true,
                createdAt: new Date().toISOString()
              },
              {
                id: 'check3',
                title: 'Elaborar planta topográfica',
                completed: false,
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: 'act2',
            title: 'Análise de viabilidade urbanística',
            description: 'Verificação de zoneamento, coeficientes de aproveitamento e restrições legais',
            responsible: 'Ana Silva',
            priority: 'medium',
            plannedStartDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
            plannedEndDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
            plannedDuration: 24,
            actualDuration: 0,
            progress: 0,
            status: 'not_started',
            stageId: 'stage1',
            dependencies: [{ id: 'dep1', dependsOn: 'act1', type: 'finish_start' }],
            isTimerActive: false,
            checklist: [
              {
                id: 'check4',
                title: 'Consultar lei de zoneamento',
                completed: false,
                createdAt: new Date().toISOString()
              },
              {
                id: 'check5',
                title: 'Verificar recuos obrigatórios',
                completed: false,
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: 'act3',
            title: 'Programa de necessidades',
            description: 'Definição detalhada dos ambientes e suas características funcionais',
            responsible: 'Carlos Santos',
            priority: 'high',
            plannedStartDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            plannedEndDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
            plannedDuration: 20,
            actualDuration: 0,
            progress: 0,
            status: 'not_started',
            stageId: 'stage1',
            dependencies: [{ id: 'dep2', dependsOn: 'act2', type: 'finish_start' }],
            isTimerActive: false,
            checklist: [
              {
                id: 'check6',
                title: 'Reunião com cliente para briefing',
                completed: false,
                createdAt: new Date().toISOString()
              },
              {
                id: 'check7',
                title: 'Elaborar lista de ambientes',
                completed: false,
                createdAt: new Date().toISOString()
              },
              {
                id: 'check8',
                title: 'Definir dimensionamento preliminar',
                completed: false,
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: 'act4',
            title: 'Estudo volumétrico',
            description: 'Desenvolvimento de alternativas volumétricas e implantação no terreno',
            responsible: 'Carlos Santos',
            priority: 'medium',
            plannedStartDate: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000).toISOString(),
            plannedEndDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
            plannedDuration: 40,
            actualDuration: 0,
            progress: 0,
            status: 'not_started',
            stageId: 'stage1',
            dependencies: [{ id: 'dep3', dependsOn: 'act3', type: 'finish_start' }],
            isTimerActive: false,
            checklist: [
              {
                id: 'check9',
                title: 'Criar maquete eletrônica preliminar',
                completed: false,
                createdAt: new Date().toISOString()
              },
              {
                id: 'check10',
                title: 'Estudar insolação e ventilação',
                completed: false,
                createdAt: new Date().toISOString()
              }
            ]
          }
        ];

        const sampleStages: LocalStage[] = [
          {
            id: 'stage1',
            name: 'Anteprojeto',
            projectId: '1',
            order: 1,
            progress: 25,
            status: 'in_progress',
            activities: sampleActivities,
            notificationRecipients: ['ana@mutabile.com.br'],
            isCustom: false
          },
          {
            id: 'stage2',
            name: 'Projeto Legal',
            projectId: '1',
            order: 2,
            progress: 0,
            status: 'not_started',
            activities: [
              {
                id: 'act5',
                title: 'Desenvolvimento de plantas baixas',
                description: 'Elaboração das plantas baixas de todos os pavimentos conforme normas municipais',
                responsible: 'Carlos Santos',
                priority: 'high',
                plannedStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                plannedEndDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
                plannedDuration: 60,
                actualDuration: 0,
                progress: 0,
                status: 'not_started',
                stageId: 'stage2',
                dependencies: [{ id: 'dep4', dependsOn: 'act4', type: 'finish_start' }],
                isTimerActive: false,
                checklist: [
                  {
                    id: 'check11',
                    title: 'Planta baixa térreo',
                    completed: false,
                    createdAt: new Date().toISOString()
                  },
                  {
                    id: 'check12',
                    title: 'Planta baixa pavimento superior',
                    completed: false,
                    createdAt: new Date().toISOString()
                  },
                  {
                    id: 'check13',
                    title: 'Planta de cobertura',
                    completed: false,
                    createdAt: new Date().toISOString()
                  }
                ]
              },
              {
                id: 'act6',
                title: 'Elaboração de cortes e fachadas',
                description: 'Desenvolvimento dos cortes longitudinais, transversais e fachadas principais',
                responsible: 'Ana Silva',
                priority: 'high',
                plannedStartDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
                plannedEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                plannedDuration: 48,
                actualDuration: 0,
                progress: 0,
                status: 'not_started',
                stageId: 'stage2',
                dependencies: [{ id: 'dep5', dependsOn: 'act5', type: 'finish_start' }],
                isTimerActive: false,
                checklist: [
                  {
                    id: 'check14',
                    title: 'Corte longitudinal AA',
                    completed: false,
                    createdAt: new Date().toISOString()
                  },
                  {
                    id: 'check15',
                    title: 'Corte transversal BB',
                    completed: false,
                    createdAt: new Date().toISOString()
                  },
                  {
                    id: 'check16',
                    title: 'Fachada principal',
                    completed: false,
                    createdAt: new Date().toISOString()
                  },
                  {
                    id: 'check17',
                    title: 'Fachadas laterais',
                    completed: false,
                    createdAt: new Date().toISOString()
                  }
                ]
              },
              {
                id: 'act7',
                title: 'Memorial descritivo e especificações',
                description: 'Elaboração do memorial descritivo com especificações técnicas dos materiais',
                responsible: 'Ana Silva',
                priority: 'medium',
                plannedStartDate: new Date(Date.now() + 46 * 24 * 60 * 60 * 1000).toISOString(),
                plannedEndDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
                plannedDuration: 24,
                actualDuration: 0,
                progress: 0,
                status: 'not_started',
                stageId: 'stage2',
                dependencies: [{ id: 'dep6', dependsOn: 'act6', type: 'finish_start' }],
                isTimerActive: false,
                checklist: [
                  {
                    id: 'check18',
                    title: 'Especificações de acabamentos',
                    completed: false,
                    createdAt: new Date().toISOString()
                  },
                  {
                    id: 'check19',
                    title: 'Memorial de cálculo de áreas',
                    completed: false,
                    createdAt: new Date().toISOString()
                  }
                ]
              }
            ],
            notificationRecipients: ['ana@mutabile.com.br'],
            isCustom: false
          },
          {
            id: 'stage3',
            name: 'Projeto Executivo',
            projectId: '1',
            order: 3,
            progress: 0,
            status: 'not_started',
            activities: [
              {
                id: 'act8',
                title: 'Detalhamento arquitetônico',
                description: 'Desenvolvimento de detalhes construtivos, esquadrias e elementos especiais',
                responsible: 'Carlos Santos',
                priority: 'high',
                plannedStartDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString(),
                plannedEndDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
                plannedDuration: 80,
                actualDuration: 0,
                progress: 0,
                status: 'not_started',
                stageId: 'stage3',
                dependencies: [{ id: 'dep7', dependsOn: 'act7', type: 'finish_start' }],
                isTimerActive: false,
                checklist: [
                  {
                    id: 'check20',
                    title: 'Detalhes de esquadrias',
                    completed: false,
                    createdAt: new Date().toISOString()
                  },
                  {
                    id: 'check21',
                    title: 'Detalhes de escadas',
                    completed: false,
                    createdAt: new Date().toISOString()
                  },
                  {
                    id: 'check22',
                    title: 'Detalhes de forro e sancas',
                    completed: false,
                    createdAt: new Date().toISOString()
                  }
                ]
              },
              {
                id: 'act9',
                title: 'Compatibilização com projetos complementares',
                description: 'Verificação e compatibilização com projetos estrutural, hidráulico e elétrico',
                responsible: 'Ana Silva',
                priority: 'high',
                plannedStartDate: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString(),
                plannedEndDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
                plannedDuration: 56,
                actualDuration: 0,
                progress: 0,
                status: 'not_started',
                stageId: 'stage3',
                dependencies: [{ id: 'dep8', dependsOn: 'act8', type: 'finish_start' }],
                isTimerActive: false,
                checklist: [
                  {
                    id: 'check23',
                    title: 'Compatibilização estrutural',
                    completed: false,
                    createdAt: new Date().toISOString()
                  },
                  {
                    id: 'check24',
                    title: 'Compatibilização hidrossanitária',
                    completed: false,
                    createdAt: new Date().toISOString()
                  },
                  {
                    id: 'check25',
                    title: 'Compatibilização elétrica',
                    completed: false,
                    createdAt: new Date().toISOString()
                  }
                ]
              },
              {
                id: 'act10',
                title: 'Quantitativos e orçamento',
                description: 'Levantamento de quantitativos de materiais e elaboração de orçamento estimativo',
                responsible: 'Marina Costa',
                priority: 'medium',
                plannedStartDate: new Date(Date.now() + 76 * 24 * 60 * 60 * 1000).toISOString(),
                plannedEndDate: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000).toISOString(),
                plannedDuration: 40,
                actualDuration: 0,
                progress: 0,
                status: 'not_started',
                stageId: 'stage3',
                dependencies: [{ id: 'dep9', dependsOn: 'act9', type: 'finish_start' }],
                isTimerActive: false,
                checklist: [
                  {
                    id: 'check26',
                    title: 'Quantitativo de materiais',
                    completed: false,
                    createdAt: new Date().toISOString()
                  },
                  {
                    id: 'check27',
                    title: 'Pesquisa de preços',
                    completed: false,
                    createdAt: new Date().toISOString()
                  },
                  {
                    id: 'check28',
                    title: 'Planilha orçamentária',
                    completed: false,
                    createdAt: new Date().toISOString()
                  }
                ]
              }
            ],
            notificationRecipients: ['ana@mutabile.com.br'],
            isCustom: false
          }
        ];

        const defaultProjects: LocalProject[] = [
          {
            id: '1',
            name: 'Residência Jardins',
            client: 'João e Maria Oliveira',
            location: 'São Paulo, SP',
            responsible: 'Ana Silva',
            controlNumber: 'MUT-2025-001',
            description: 'Casa unifamiliar de alto padrão com 380m²',
            status: 'in_progress',
            progress: 8,
            risk: 'on_time',
            nextDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            stages: sampleStages,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
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
            risk: 'on_time',
            stages: [
              {
                id: 'stage4',
                name: 'Anteprojeto',
                projectId: '2',
                order: 1,
                progress: 15,
                status: 'in_progress',
                activities: [
                  {
                    id: 'act11',
                    title: 'Análise do programa comercial',
                    description: 'Estudo das necessidades comerciais e definição do mix de lojas',
                    responsible: 'Carlos Santos',
                    priority: 'high',
                    plannedStartDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 48,
                    actualDuration: 12,
                    progress: 25,
                    status: 'in_progress',
                    stageId: 'stage4',
                    dependencies: [],
                    isTimerActive: false,
                    actualStartDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    checklist: [
                      {
                        id: 'check29',
                        title: 'Reunião com investidores',
                        completed: true,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check30',
                        title: 'Estudo de mercado local',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  },
                  {
                    id: 'act12',
                    title: 'Estudo de fluxos e circulação',
                    description: 'Análise dos fluxos de pedestres e veículos, definição de acessos',
                    responsible: 'Ana Silva',
                    priority: 'medium',
                    plannedStartDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 32,
                    actualDuration: 0,
                    progress: 0,
                    status: 'not_started',
                    stageId: 'stage4',
                    dependencies: [{ id: 'dep10', dependsOn: 'act11', type: 'finish_start' }],
                    isTimerActive: false,
                    checklist: [
                      {
                        id: 'check31',
                        title: 'Mapeamento de fluxos existentes',
                        completed: false,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check32',
                        title: 'Definição de acessos principais',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  }
                ],
                notificationRecipients: ['carlos@mutabile.com.br'],
                isCustom: false
              },
              {
                id: 'stage5',
                name: 'Projeto Legal',
                projectId: '2',
                order: 2,
                progress: 0,
                status: 'not_started',
                activities: [
                  {
                    id: 'act13',
                    title: 'Projeto de prevenção contra incêndio',
                    description: 'Desenvolvimento do projeto de segurança contra incêndio conforme normas do Corpo de Bombeiros',
                    responsible: 'Marina Costa',
                    priority: 'high',
                    plannedStartDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 72,
                    actualDuration: 0,
                    progress: 0,
                    status: 'not_started',
                    stageId: 'stage5',
                    dependencies: [{ id: 'dep11', dependsOn: 'act12', type: 'finish_start' }],
                    isTimerActive: false,
                    checklist: [
                      {
                        id: 'check33',
                        title: 'Cálculo de população e saídas de emergência',
                        completed: false,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check34',
                        title: 'Projeto de sinalização de emergência',
                        completed: false,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check35',
                        title: 'Especificação de equipamentos de combate',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  }
                ],
                notificationRecipients: ['carlos@mutabile.com.br'],
                isCustom: false
              },
              {
                id: 'stage6',
                name: 'Projeto Executivo',
                projectId: '2',
                order: 3,
                progress: 0,
                status: 'not_started',
                activities: [
                  {
                    id: 'act14',
                    title: 'Projeto de fachadas e revestimentos',
                    description: 'Detalhamento das fachadas com especificação de materiais e sistemas construtivos',
                    responsible: 'Carlos Santos',
                    priority: 'medium',
                    plannedStartDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 96,
                    actualDuration: 0,
                    progress: 0,
                    status: 'not_started',
                    stageId: 'stage6',
                    dependencies: [{ id: 'dep12', dependsOn: 'act13', type: 'finish_start' }],
                    isTimerActive: false,
                    checklist: [
                      {
                        id: 'check36',
                        title: 'Detalhes de fixação de revestimentos',
                        completed: false,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check37',
                        title: 'Especificação de vidros e esquadrias',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  }
                ],
                notificationRecipients: ['carlos@mutabile.com.br'],
                isCustom: false
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(defaultProjects));
      }
    } catch (error) {
      console.error('Error initializing default data:', error);
      // Se houver erro, limpar dados corrompidos e tentar novamente
      localStorage.removeItem(this.USERS_KEY);
      localStorage.removeItem(this.PROJECTS_KEY);
      localStorage.removeItem(this.CURRENT_USER_KEY);
      
      // Tentar inicializar novamente com dados mínimos
      const defaultUsers: LocalUser[] = [
        {
          id: '1',
          name: 'Marina Costa',
          email: 'marina@mutabile.com.br',
          role: 'Administradora',
          authLevel: 'admin',
          passwordHash: simpleHash('admin123'),
          teamId: 'team1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      localStorage.setItem(this.USERS_KEY, JSON.stringify(defaultUsers));
      
      const defaultProjects: LocalProject[] = [];
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(defaultProjects));
    }
  }

  // Método para adicionar atividades de exemplo aos projetos existentes
  static addSampleActivitiesToExistingProjects() {
    try {
      const projects = this.getProjects();
      
      if (projects.length === 0) {
        console.log('Nenhum projeto encontrado para adicionar atividades');
        return;
      }

      const updatedProjects = projects.map(project => {
        // Se o projeto já tem atividades, não sobrescrever
        const hasActivities = project.stages.some(stage => 
          stage.activities && stage.activities.length > 0
        );
        
        if (hasActivities) {
          console.log(`Projeto ${project.name} já tem atividades, pulando...`);
          return project;
        }

        console.log(`Adicionando atividades ao projeto: ${project.name}`);
        
        if (project.id === '1' || project.name === 'Residência Jardins') {
          // Atividades para Residência Jardins
          const updatedStages = project.stages.map(stage => {
            if (stage.name === 'Anteprojeto') {
              return {
                ...stage,
                progress: 25,
                status: 'in_progress' as const,
                activities: [
                  {
                    id: 'act1',
                    title: 'Levantamento topográfico',
                    description: 'Análise detalhada das condições do terreno, medições e levantamento planialtimétrico',
                    responsible: 'Carlos Santos',
                    priority: 'high' as const,
                    plannedStartDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 32,
                    actualDuration: 18,
                    progress: 75,
                    status: 'in_progress' as const,
                    stageId: stage.id,
                    dependencies: [],
                    isTimerActive: false,
                    actualStartDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    checklist: [
                      {
                        id: 'check1',
                        title: 'Solicitar certidão de inteiro teor',
                        completed: true,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check2',
                        title: 'Realizar medições in loco',
                        completed: true,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check3',
                        title: 'Elaborar planta topográfica',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  },
                  {
                    id: 'act2',
                    title: 'Análise de viabilidade urbanística',
                    description: 'Verificação de zoneamento, coeficientes de aproveitamento e restrições legais',
                    responsible: 'Ana Silva',
                    priority: 'medium' as const,
                    plannedStartDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 24,
                    actualDuration: 0,
                    progress: 0,
                    status: 'not_started' as const,
                    stageId: stage.id,
                    dependencies: [{ id: 'dep1', dependsOn: 'act1', type: 'finish_start' }],
                    isTimerActive: false,
                    checklist: [
                      {
                        id: 'check4',
                        title: 'Consultar lei de zoneamento',
                        completed: false,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check5',
                        title: 'Verificar recuos obrigatórios',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  },
                  {
                    id: 'act3',
                    title: 'Programa de necessidades',
                    description: 'Definição detalhada dos ambientes e suas características funcionais',
                    responsible: 'Carlos Santos',
                    priority: 'high' as const,
                    plannedStartDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 20,
                    actualDuration: 0,
                    progress: 0,
                    status: 'not_started' as const,
                    stageId: stage.id,
                    dependencies: [{ id: 'dep2', dependsOn: 'act2', type: 'finish_start' }],
                    isTimerActive: false,
                    checklist: [
                      {
                        id: 'check6',
                        title: 'Reunião com cliente para briefing',
                        completed: false,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check7',
                        title: 'Elaborar lista de ambientes',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  },
                  {
                    id: 'act4',
                    title: 'Estudo volumétrico',
                    description: 'Desenvolvimento de alternativas volumétricas e implantação no terreno',
                    responsible: 'Carlos Santos',
                    priority: 'medium' as const,
                    plannedStartDate: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 40,
                    actualDuration: 0,
                    progress: 0,
                    status: 'not_started' as const,
                    stageId: stage.id,
                    dependencies: [{ id: 'dep3', dependsOn: 'act3', type: 'finish_start' }],
                    isTimerActive: false,
                    checklist: [
                      {
                        id: 'check9',
                        title: 'Criar maquete eletrônica preliminar',
                        completed: false,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check10',
                        title: 'Estudar insolação e ventilação',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  }
                ]
              };
            } else if (stage.name === 'Projeto Legal') {
              return {
                ...stage,
                activities: [
                  {
                    id: 'act5',
                    title: 'Desenvolvimento de plantas baixas',
                    description: 'Elaboração das plantas baixas de todos os pavimentos conforme normas municipais',
                    responsible: 'Carlos Santos',
                    priority: 'high' as const,
                    plannedStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 60,
                    actualDuration: 0,
                    progress: 0,
                    status: 'not_started' as const,
                    stageId: stage.id,
                    dependencies: [{ id: 'dep4', dependsOn: 'act4', type: 'finish_start' }],
                    isTimerActive: false,
                    checklist: [
                      {
                        id: 'check11',
                        title: 'Planta baixa térreo',
                        completed: false,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check12',
                        title: 'Planta baixa pavimento superior',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  },
                  {
                    id: 'act6',
                    title: 'Elaboração de cortes e fachadas',
                    description: 'Desenvolvimento dos cortes longitudinais, transversais e fachadas principais',
                    responsible: 'Ana Silva',
                    priority: 'high' as const,
                    plannedStartDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 48,
                    actualDuration: 0,
                    progress: 0,
                    status: 'not_started' as const,
                    stageId: stage.id,
                    dependencies: [{ id: 'dep5', dependsOn: 'act5', type: 'finish_start' }],
                    isTimerActive: false,
                    checklist: [
                      {
                        id: 'check14',
                        title: 'Corte longitudinal AA',
                        completed: false,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check15',
                        title: 'Fachada principal',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  }
                ]
              };
            } else if (stage.name === 'Projeto Executivo') {
              return {
                ...stage,
                activities: [
                  {
                    id: 'act8',
                    title: 'Detalhamento arquitetônico',
                    description: 'Desenvolvimento de detalhes construtivos, esquadrias e elementos especiais',
                    responsible: 'Carlos Santos',
                    priority: 'high' as const,
                    plannedStartDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 80,
                    actualDuration: 0,
                    progress: 0,
                    status: 'not_started' as const,
                    stageId: stage.id,
                    dependencies: [{ id: 'dep7', dependsOn: 'act6', type: 'finish_start' }],
                    isTimerActive: false,
                    checklist: [
                      {
                        id: 'check20',
                        title: 'Detalhes de esquadrias',
                        completed: false,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check21',
                        title: 'Detalhes de escadas',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  },
                  {
                    id: 'act9',
                    title: 'Compatibilização com projetos complementares',
                    description: 'Verificação e compatibilização com projetos estrutural, hidráulico e elétrico',
                    responsible: 'Ana Silva',
                    priority: 'high' as const,
                    plannedStartDate: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 56,
                    actualDuration: 0,
                    progress: 0,
                    status: 'not_started' as const,
                    stageId: stage.id,
                    dependencies: [{ id: 'dep8', dependsOn: 'act8', type: 'finish_start' }],
                    isTimerActive: false,
                    checklist: [
                      {
                        id: 'check23',
                        title: 'Compatibilização estrutural',
                        completed: false,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check24',
                        title: 'Compatibilização hidrossanitária',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  }
                ]
              };
            }
            return stage;
          });
          
          return {
            ...project,
            stages: updatedStages,
            progress: 8,
            updatedAt: new Date().toISOString()
          };
        } else if (project.id === '2' || project.name === 'Edifício Comercial Centro') {
          // Atividades para Edifício Comercial Centro
          const updatedStages = project.stages.map(stage => {
            if (stage.name === 'Anteprojeto') {
              return {
                ...stage,
                progress: 15,
                status: 'in_progress' as const,
                activities: [
                  {
                    id: 'act11',
                    title: 'Análise do programa comercial',
                    description: 'Estudo das necessidades comerciais e definição do mix de lojas',
                    responsible: 'Carlos Santos',
                    priority: 'high' as const,
                    plannedStartDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 48,
                    actualDuration: 12,
                    progress: 25,
                    status: 'in_progress' as const,
                    stageId: stage.id,
                    dependencies: [],
                    isTimerActive: false,
                    actualStartDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    checklist: [
                      {
                        id: 'check29',
                        title: 'Reunião com investidores',
                        completed: true,
                        createdAt: new Date().toISOString()
                      },
                      {
                        id: 'check30',
                        title: 'Estudo de mercado local',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  },
                  {
                    id: 'act12',
                    title: 'Estudo de fluxos e circulação',
                    description: 'Análise dos fluxos de pedestres e veículos, definição de acessos',
                    responsible: 'Ana Silva',
                    priority: 'medium' as const,
                    plannedStartDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 32,
                    actualDuration: 0,
                    progress: 0,
                    status: 'not_started' as const,
                    stageId: stage.id,
                    dependencies: [{ id: 'dep10', dependsOn: 'act11', type: 'finish_start' }],
                    isTimerActive: false,
                    checklist: [
                      {
                        id: 'check31',
                        title: 'Mapeamento de fluxos existentes',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  }
                ]
              };
            } else if (stage.name === 'Projeto Legal') {
              return {
                ...stage,
                activities: [
                  {
                    id: 'act13',
                    title: 'Projeto de prevenção contra incêndio',
                    description: 'Desenvolvimento do projeto de segurança contra incêndio conforme normas do Corpo de Bombeiros',
                    responsible: 'Marina Costa',
                    priority: 'high' as const,
                    plannedStartDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 72,
                    actualDuration: 0,
                    progress: 0,
                    status: 'not_started' as const,
                    stageId: stage.id,
                    dependencies: [{ id: 'dep11', dependsOn: 'act12', type: 'finish_start' }],
                    isTimerActive: false,
                    checklist: [
                      {
                        id: 'check33',
                        title: 'Cálculo de população e saídas de emergência',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  }
                ]
              };
            } else if (stage.name === 'Projeto Executivo') {
              return {
                ...stage,
                activities: [
                  {
                    id: 'act14',
                    title: 'Projeto de fachadas e revestimentos',
                    description: 'Detalhamento das fachadas com especificação de materiais e sistemas construtivos',
                    responsible: 'Carlos Santos',
                    priority: 'medium' as const,
                    plannedStartDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedEndDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
                    plannedDuration: 96,
                    actualDuration: 0,
                    progress: 0,
                    status: 'not_started' as const,
                    stageId: stage.id,
                    dependencies: [{ id: 'dep12', dependsOn: 'act13', type: 'finish_start' }],
                    isTimerActive: false,
                    checklist: [
                      {
                        id: 'check36',
                        title: 'Detalhes de fixação de revestimentos',
                        completed: false,
                        createdAt: new Date().toISOString()
                      }
                    ]
                  }
                ]
              };
            }
            return stage;
          });
          
          return {
            ...project,
            stages: updatedStages,
            progress: 5,
            updatedAt: new Date().toISOString()
          };
        }
        
        return project;
      });
      
      // Salvar os projetos atualizados
      this.saveProjects(updatedProjects);
      console.log('Atividades de exemplo adicionadas com sucesso!');
      
    } catch (error) {
      console.error('Erro ao adicionar atividades de exemplo:', error);
    }
  }

  // Métodos para usuários
  static getUsers(): LocalUser[] {
    try {
      const users = localStorage.getItem(this.USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  static saveUsers(users: LocalUser[]) {
    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  static authenticateUser(email: string, password: string): LocalUser | null {
    try {
      console.log('Attempting to authenticate:', email);
      const users = this.getUsers();
      console.log('Found users:', users.length);
      const user = users.find(u => u.email === email);
      
      if (user) {
        console.log('User found:', user.email, 'Auth level:', user.authLevel);
        const isValidPassword = verifyPassword(password, user.passwordHash);
        console.log('Password valid:', isValidPassword);
        
        if (isValidPassword) {
          return user;
        } else {
          console.log('Password verification failed');
        }
      } else {
        console.log('User not found with email:', email);
      }
    } catch (error) {
      console.error('Error authenticating user:', error);
    }
    
    return null;
  }

  static createUser(userData: Omit<LocalUser, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash'> & { password: string }): LocalUser {
    try {
      const users = this.getUsers();
      const newUser: LocalUser = {
        ...userData,
        id: Date.now().toString(),
        passwordHash: simpleHash(userData.password),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      users.push(newUser);
      this.saveUsers(users);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static updateUser(id: string, updates: Partial<LocalUser> & { password?: string }): boolean {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.id === id);
      
      if (userIndex === -1) return false;
      
      const updatedUser = { ...users[userIndex], ...updates };
      
      if (updates.password) {
        updatedUser.passwordHash = simpleHash(updates.password);
      }
      
      updatedUser.updatedAt = new Date().toISOString();
      users[userIndex] = updatedUser;
      
      this.saveUsers(users);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  static deleteUser(id: string): boolean {
    try {
      const users = this.getUsers();
      const filteredUsers = users.filter(u => u.id !== id);
      
      if (filteredUsers.length === users.length) return false;
      
      this.saveUsers(filteredUsers);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Métodos para projetos
  static getProjects(): LocalProject[] {
    try {
      const projects = localStorage.getItem(this.PROJECTS_KEY);
      return projects ? JSON.parse(projects) : [];
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }

  static saveProjects(projects: LocalProject[]) {
    try {
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  }

  static createProject(projectData: Omit<LocalProject, 'id' | 'createdAt' | 'updatedAt'>): LocalProject {
    try {
      const projects = this.getProjects();
      const newProject: LocalProject = {
        ...projectData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      projects.push(newProject);
      this.saveProjects(projects);
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  static updateProject(id: string, updates: Partial<LocalProject>): boolean {
    try {
      const projects = this.getProjects();
      const projectIndex = projects.findIndex(p => p.id === id);
      
      if (projectIndex === -1) return false;
      
      const updatedProject = { 
        ...projects[projectIndex], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      projects[projectIndex] = updatedProject;
      this.saveProjects(projects);
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      return false;
    }
  }

  static deleteProject(id: string): boolean {
    try {
      const projects = this.getProjects();
      const filteredProjects = projects.filter(p => p.id !== id);
      
      if (filteredProjects.length === projects.length) return false;
      
      this.saveProjects(filteredProjects);
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // Usuário atual
  static getCurrentUser(): LocalUser | null {
    try {
      const user = localStorage.getItem(this.CURRENT_USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static setCurrentUser(user: LocalUser | null) {
    try {
      if (user) {
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.CURRENT_USER_KEY);
      }
    } catch (error) {
      console.error('Error setting current user:', error);
    }
  }
}

export default LocalStorage;