import { supabase } from './supabase';
import { projectOperations, clientOperations, supplierOperations, defaultActivityOperations } from './database';

export async function initializeDemoData() {
  try {
    console.log('Inicializando dados demo...');
    
    // Verificar se há um usuário autenticado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('Nenhum usuário autenticado. Faça login para inicializar os dados demo.');
      return;
    }
    
    // Verificar se já existem projetos no banco (indicando que dados demo já foram criados)
    const existingProjects = await projectOperations.getAll();
    
    if (existingProjects.length > 0) {
      console.log('Dados demo já existem no banco de dados');
      return;
    }
    
    console.log('Inicializando dados demo no Supabase...');
    
    // Criar clientes demo
    await createDemoClients();
    
    // Criar fornecedores demo
    await createDemoSuppliers();
    
    // Criar projetos demo
    await createDemoProjects();
    
    // Criar atividades padrão
    await createDefaultActivities();
    
    console.log('Dados demo criados com sucesso');
    
  } catch (e: any) {
    console.error('initializeDemoData error:', e);
    throw new Error(`Falha ao inicializar dados: ${e?.message || 'erro desconhecido'}`);
  }
}

async function createDemoClients() {
  const demoClients = [
    {
      name: 'João e Maria Oliveira',
      document: '123.456.789-00',
      documentType: 'cpf' as const,
      email: 'joao.oliveira@email.com',
      phone: '(11) 99999-1234',
      address: {
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Jardins',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      },
      funnelStage: 'closed' as const
    },
    {
      name: 'Construtora Delta Ltda',
      document: '12.345.678/0001-90',
      documentType: 'cnpj' as const,
      email: 'contato@construtoredelta.com.br',
      phone: '(21) 98888-5678',
      address: {
        street: 'Av. Atlântica',
        number: '500',
        neighborhood: 'Copacabana',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '22070-000'
      },
      funnelStage: 'closed' as const
    }
  ];

  for (const clientData of demoClients) {
    try {
      await clientOperations.create(clientData);
      console.log(`Cliente ${clientData.name} criado com sucesso`);
    } catch (error) {
      console.error(`Erro ao criar cliente ${clientData.name}:`, error);
    }
  }
}

async function createDemoSuppliers() {
  const demoSuppliers = [
    {
      name: 'Construtora Silva & Associados',
      cnpj: '12.345.678/0001-90',
      location: {
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil'
      },
      website: 'https://silvaassociados.com.br',
      mainContact: 'João Silva - (11) 99999-1234',
      description: 'Especializada em construção civil, reformas e acabamentos de alto padrão',
      observations: 'Excelente qualidade, sempre cumpre prazos. Trabalha com materiais premium.',
      ratings: {
        quality: 5,
        price: 4,
        recommendation: 5
      },
      linkedProjects: []
    },
    {
      name: 'Marmoraria Pedra Nobre',
      cnpj: '23.456.789/0001-01',
      location: {
        city: 'Cachoeiro de Itapemirim',
        state: 'ES',
        country: 'Brasil'
      },
      website: 'https://pedranobre.com.br',
      mainContact: 'Maria Santos - (28) 98888-5678',
      description: 'Fornecimento e instalação de mármores, granitos e pedras naturais',
      observations: 'Melhor preço da região. Entrega rápida e instalação impecável.',
      ratings: {
        quality: 5,
        price: 5,
        recommendation: 5
      },
      linkedProjects: []
    }
  ];

  for (const supplierData of demoSuppliers) {
    try {
      await supplierOperations.create(supplierData);
      console.log(`Fornecedor ${supplierData.name} criado com sucesso`);
    } catch (error) {
      console.error(`Erro ao criar fornecedor ${supplierData.name}:`, error);
    }
  }
}

async function createDemoProjects() {
  const demoProjects = [
    {
      name: 'Residência Jardins',
      client: 'João e Maria Oliveira',
      location: 'São Paulo, SP',
      responsible: 'Ana Silva',
      controlNumber: 'MUT-2025-001',
      description: 'Casa unifamiliar de alto padrão com 380m²',
      status: 'in_progress' as const,
      progress: 15,
      risk: 'on_time' as const,
      nextDeadline: new Date('2025-02-20'),
      stages: [
        {
          id: 'stage_001',
          name: 'Anteprojeto',
          projectId: '',
          order: 1,
          progress: 25,
          status: 'in_progress' as const,
          notificationRecipients: ['ana@mutabile.com.br'],
          isCustom: false,
          activities: [
            {
              id: 'activity_001',
              title: 'Levantamento do terreno',
              description: 'Análise topográfica e condições do local',
              responsible: 'Carlos Santos',
              priority: 'high' as const,
              plannedStartDate: new Date('2025-01-15'),
              plannedEndDate: new Date('2025-01-20'),
              plannedDuration: 24,
              actualDuration: 8,
              progress: 50,
              status: 'in_progress' as const,
              stageId: 'stage_001',
              dependencies: [],
              isTimerActive: false,
              checklist: [
                {
                  id: 'check_001',
                  title: 'Levantamento topográfico',
                  completed: true,
                  createdAt: new Date()
                },
                {
                  id: 'check_002',
                  title: 'Análise de orientação solar',
                  completed: false,
                  createdAt: new Date()
                }
              ],
              driveLinks: []
            }
          ]
        }
      ]
    }
  ];

  for (const projectData of demoProjects) {
    try {
      await projectOperations.create(projectData);
      console.log(`Projeto ${projectData.name} criado com sucesso`);
    } catch (error) {
      console.error(`Erro ao criar projeto ${projectData.name}:`, error);
    }
  }
}

async function createDefaultActivities() {
  const defaultActivities = [
    {
      stageName: 'Anteprojeto',
      activities: [
        {
          title: 'Levantamento e análise do terreno',
          description: 'Análise topográfica, orientação solar, ventos predominantes e condições do local',
          plannedDuration: 16,
          priority: 'high',
          checklist: [
            { id: 'c1', title: 'Levantamento topográfico' },
            { id: 'c2', title: 'Análise de orientação solar' },
            { id: 'c3', title: 'Estudo de ventos predominantes' },
            { id: 'c4', title: 'Análise do entorno e acessos' }
          ],
          driveLinks: [],
          dependencies: []
        },
        {
          title: 'Programa de necessidades',
          description: 'Definição detalhada dos ambientes, áreas e funcionalidades do projeto',
          plannedDuration: 12,
          priority: 'high',
          checklist: [
            { id: 'c1', title: 'Entrevista com cliente' },
            { id: 'c2', title: 'Definição de ambientes' },
            { id: 'c3', title: 'Cálculo de áreas necessárias' },
            { id: 'c4', title: 'Aprovação do programa' }
          ],
          driveLinks: [],
          dependencies: []
        }
      ]
    },
    {
      stageName: 'Projeto Legal',
      activities: [
        {
          title: 'Desenvolvimento de plantas baixas técnicas',
          description: 'Plantas baixas técnicas com cotas, especificações e detalhes para aprovação',
          plannedDuration: 24,
          priority: 'high',
          checklist: [
            { id: 'c1', title: 'Plantas baixas cotadas' },
            { id: 'c2', title: 'Especificação de materiais' },
            { id: 'c3', title: 'Detalhes construtivos básicos' },
            { id: 'c4', title: 'Revisão técnica' }
          ],
          driveLinks: [],
          dependencies: []
        }
      ]
    }
  ];

  for (const stageData of defaultActivities) {
    for (const activityData of stageData.activities) {
      try {
        await defaultActivityOperations.create(stageData.stageName, activityData);
      } catch (error) {
        console.error(`Erro ao criar atividade padrão ${activityData.title}:`, error);
      }
    }
  }
}