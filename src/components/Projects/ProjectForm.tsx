import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { Plus, X } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useConfirm } from '../../hooks/useConfirm';
import type { Project } from '../../types';
import { defaultStages } from '../../data/mockData';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  project?: Project;
}

interface CustomStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (stageName: string) => void;
}

function CustomStageModal({ isOpen, onClose, onAdd }: CustomStageModalProps) {
  const [stageName, setStageName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stageName.trim()) {
      onAdd(stageName.trim());
      setStageName('');
      onClose();
    }
  };

  const handleClose = () => {
    setStageName('');
    onClose();
  };

  return (
    <div className={`${isOpen ? 'fixed inset-0 z-[60] overflow-y-auto' : 'hidden'}`}>
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
        
        <div className="inline-block w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle">
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Nova Etapa Personalizada</h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <span className="sr-only">Fechar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="bg-white px-6 py-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Etapa *
          </label>
          <input
            type="text"
            required
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            placeholder="Ex: Aprovação de Licenças, Detalhamento..."
            autoFocus
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!stageName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Etapa
          </Button>
        </div>
      </form>
          </div>
        </div>
      </div>
    </div>
  );
}
export function ProjectForm({ isOpen, onClose, onSubmit, project }: ProjectFormProps) {
  const { addProject } = useProject();
  const { getAllUsers } = useAuth();
  const { toast, confirm } = useNotification();
  const users = getAllUsers();
  const [showCustomStageModal, setShowCustomStageModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: project?.name || '',
    client: project?.client || '',
    location: project?.location || '',
    responsible: project?.responsible || '',
    controlNumber: project?.controlNumber || '',
    description: project?.description || '',
    status: project?.status || 'planning' as const,
    selectedStages: project?.stages.map(s => s.name) || ['Anteprojeto']
  });

  // Update form data when project changes
  React.useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        client: project.client,
        location: project.location,
        responsible: project.responsible,
        controlNumber: project.controlNumber,
        description: project.description,
        status: project.status,
        selectedStages: project.stages.map(s => s.name)
      });
    }
  }, [project]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Garantir que as atividades padrão estejam disponíveis
    try {
      const saved = localStorage.getItem('mutabile_default_activities');
      if (!saved) {
        console.log('Inicializando atividades padrão...');
        // Importar e executar a inicialização das atividades padrão
        const sampleActivities = [
          {
            stageName: 'Anteprojeto',
            activities: [
              {
                id: 'ant_001',
                title: 'Levantamento e análise do terreno',
                description: 'Análise topográfica, orientação solar, ventos predominantes e condições do local',
                plannedDuration: 16,
                priority: 'high',
                dependencies: [],
                checklist: [
                  { id: 'ant_001_c1', title: 'Levantamento topográfico' },
                  { id: 'ant_001_c2', title: 'Análise de orientação solar' },
                  { id: 'ant_001_c3', title: 'Estudo de ventos predominantes' },
                  { id: 'ant_001_c4', title: 'Análise do entorno e acessos' }
                ],
                driveLinks: []
              },
              {
                id: 'ant_002',
                title: 'Programa de necessidades',
                description: 'Definição detalhada dos ambientes, áreas e funcionalidades do projeto',
                plannedDuration: 12,
                priority: 'high',
                dependencies: [
                  { id: 'ant_002_dep1', dependsOn: 'ant_001', type: 'finish_start' }
                ],
                checklist: [
                  { id: 'ant_002_c1', title: 'Entrevista com cliente' },
                  { id: 'ant_002_c2', title: 'Definição de ambientes' },
                  { id: 'ant_002_c3', title: 'Cálculo de áreas necessárias' },
                  { id: 'ant_002_c4', title: 'Aprovação do programa' }
                ],
                driveLinks: []
              },
              {
                id: 'ant_003',
                title: 'Estudo de viabilidade urbanística',
                description: 'Análise de zoneamento, recuos, taxa de ocupação e restrições legais',
                plannedDuration: 8,
                priority: 'high',
                dependencies: [
                  { id: 'ant_003_dep1', dependsOn: 'ant_001', type: 'finish_start' }
                ],
                checklist: [
                  { id: 'ant_003_c1', title: 'Consulta ao zoneamento' },
                  { id: 'ant_003_c2', title: 'Verificação de recuos obrigatórios' },
                  { id: 'ant_003_c3', title: 'Cálculo de taxa de ocupação' },
                  { id: 'ant_003_c4', title: 'Análise de restrições ambientais' }
                ],
                driveLinks: []
              }
            ]
          },
          {
            stageName: 'Projeto Legal',
            activities: [
              {
                id: 'leg_001',
                title: 'Desenvolvimento de plantas baixas técnicas',
                description: 'Plantas baixas técnicas com cotas, especificações e detalhes para aprovação',
                plannedDuration: 24,
                priority: 'high',
                dependencies: [],
                checklist: [
                  { id: 'leg_001_c1', title: 'Plantas baixas cotadas' },
                  { id: 'leg_001_c2', title: 'Especificação de materiais' },
                  { id: 'leg_001_c3', title: 'Detalhes construtivos básicos' },
                  { id: 'leg_001_c4', title: 'Revisão técnica' }
                ],
                driveLinks: []
              },
              {
                id: 'leg_002',
                title: 'Cortes e fachadas',
                description: 'Desenvolvimento de cortes longitudinais, transversais e fachadas',
                plannedDuration: 20,
                priority: 'high',
                dependencies: [
                  { id: 'leg_002_dep1', dependsOn: 'leg_001', type: 'finish_start' }
                ],
                checklist: [
                  { id: 'leg_002_c1', title: 'Cortes longitudinais e transversais' },
                  { id: 'leg_002_c2', title: 'Fachadas principais' },
                  { id: 'leg_002_c3', title: 'Indicação de materiais' },
                  { id: 'leg_002_c4', title: 'Cotas de nível' }
                ],
                driveLinks: []
              }
            ]
          },
          {
            stageName: 'Projeto Executivo',
            activities: [
              {
                id: 'exe_001',
                title: 'Detalhamento arquitetônico',
                description: 'Detalhamento completo de todos os elementos arquitetônicos',
                plannedDuration: 32,
                priority: 'high',
                dependencies: [],
                checklist: [
                  { id: 'exe_001_c1', title: 'Detalhes de esquadrias' },
                  { id: 'exe_001_c2', title: 'Detalhes de acabamentos' },
                  { id: 'exe_001_c3', title: 'Detalhes construtivos' },
                  { id: 'exe_001_c4', title: 'Especificações técnicas' }
                ],
                driveLinks: []
              }
            ]
          },
          {
            stageName: 'Planejamento',
            activities: [
              {
                id: 'pla_001',
                title: 'Definição de escopo e cronograma',
                description: 'Definição detalhada do escopo do projeto e cronograma de execução',
                plannedDuration: 8,
                priority: 'high',
                dependencies: [],
                checklist: [
                  { id: 'pla_001_c1', title: 'Definição do escopo detalhado' },
                  { id: 'pla_001_c2', title: 'Cronograma macro' },
                  { id: 'pla_001_c3', title: 'Marcos principais' },
                  { id: 'pla_001_c4', title: 'Aprovação com cliente' }
                ],
                driveLinks: []
              }
            ]
          }
        ];
        
        localStorage.setItem('mutabile_default_activities', JSON.stringify(sampleActivities));
        console.log('Atividades padrão inicializadas com sucesso');
      }
    } catch (error) {
      console.error('Erro ao inicializar atividades padrão:', error);
    }
    
    // Combine default and custom stages
    const allStages = formData.selectedStages;
    
    // Load default activities for each stage
    const loadDefaultActivities = (stageName: string) => {
      try {
        const saved = localStorage.getItem('mutabile_default_activities');
        if (saved) {
          const defaultActivities = JSON.parse(saved);
          const stageData = defaultActivities.find((sa: any) => sa.stageName === stageName);
          const activities = stageData?.activities || [];
          console.log(`Carregando ${activities.length} atividades padrão para ${stageName}`);
          return activities;
        }
      } catch (error) {
        console.error('Error loading default activities:', error);
      }
      return [];
    };
    
    let stages;
    
    if (project) {
      // When editing, preserve existing stages and their activities
      const existingStagesByName = new Map(
        project.stages.map(stage => [stage.name, stage])
      );
      
      stages = allStages.map((stageName, index) => {
        const existingStage = existingStagesByName.get(stageName);
        
        if (existingStage) {
          // Preserve existing stage with all its activities
          return {
            ...existingStage,
            order: index + 1, // Update order in case stages were reordered
            projectId: project.id
          };
        } else {
          // Create new stage with default activities
          const defaultActivities = loadDefaultActivities(stageName);
          const activities = defaultActivities.map((defaultActivity: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            title: defaultActivity.title,
            description: defaultActivity.description,
            responsible: '', // Will be assigned later
            priority: defaultActivity.priority,
            plannedStartDate: new Date(),
            plannedEndDate: new Date(Date.now() + defaultActivity.plannedDuration * 60 * 60 * 1000),
            actualStartDate: undefined,
            actualEndDate: undefined,
            plannedDuration: defaultActivity.plannedDuration,
            actualDuration: 0,
            progress: 0,
            status: 'not_started' as const,
            stageId: '',
            dependencies: (defaultActivity.dependencies || []).map((dep: any) => ({
              ...dep,
              id: Math.random().toString(36).substr(2, 9)
            })),
            isTimerActive: false,
            timerStartTime: undefined,
            checklist: defaultActivity.checklist.map((item: any) => ({
              id: Math.random().toString(36).substr(2, 9),
              title: item.title,
              completed: false,
              createdAt: new Date()
            })),
            driveLinks: (defaultActivity.driveLinks || []).map((link: any) => ({
              id: Math.random().toString(36).substr(2, 9),
              title: link.title,
              url: link.url,
              description: link.description,
              createdAt: new Date()
            }))
          }));
          
          return {
            id: Math.random().toString(36).substr(2, 9),
            name: stageName,
            projectId: project.id,
            order: index + 1,
            progress: 0,
            status: 'not_started' as const,
            activities,
            notificationRecipients: [],
            isCustom: !defaultStages.some(ds => ds.name === stageName)
          };
        }
      });
    } else {
      // When creating new project, create stages with default activities
      stages = allStages.map((stageName, index) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: stageName,
        projectId: '',
        order: index + 1,
        progress: 0,
        status: 'not_started' as const,
        activities: loadDefaultActivities(stageName).map((defaultActivity: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          title: defaultActivity.title,
          description: defaultActivity.description,
          responsible: '', // Will be assigned later
          priority: defaultActivity.priority,
          plannedStartDate: new Date(),
          plannedEndDate: new Date(Date.now() + defaultActivity.plannedDuration * 60 * 60 * 1000),
          actualStartDate: undefined,
          actualEndDate: undefined,
          plannedDuration: defaultActivity.plannedDuration,
          actualDuration: 0,
          progress: 0,
          status: 'not_started' as const,
          stageId: '',
          dependencies: (defaultActivity.dependencies || []).map((dep: any) => ({
            ...dep,
            id: Math.random().toString(36).substr(2, 9)
          })),
          isTimerActive: false,
          timerStartTime: undefined,
          checklist: defaultActivity.checklist.map((item: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            title: item.title,
            completed: false,
            createdAt: new Date()
          }))
        })),
        notificationRecipients: [],
        isCustom: !defaultStages.some(ds => ds.name === stageName)
      }));
    }

    const projectData = {
      ...formData,
      progress: project?.progress || 0,
      stages,
      risk: project?.risk || 'on_time'
    };

    if (project) {
      // Editing existing project
      onSubmit(projectData);
      toast.success('Projeto atualizado com sucesso!');
    } else {
      // Creating new project
      addProject(projectData);
      const totalDefaultActivities = stages.reduce((sum, stage) => sum + stage.activities.length, 0);
      if (totalDefaultActivities > 0) {
        toast.success(`Projeto criado com sucesso! ${totalDefaultActivities} atividades padrão foram adicionadas automaticamente.`);
      } else {
        toast.success('Projeto criado com sucesso!');
      }
    }
    onSubmit(projectData);
    
    // Reset form only if creating new project
    if (!project) {
      setFormData({
        name: '',
        client: '',
        location: '',
        responsible: '',
        controlNumber: '',
        description: '',
        status: 'planning',
        selectedStages: ['Anteprojeto']
      });
    }
    
    onClose();
  };

  const toggleStage = (stageName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStages: prev.selectedStages.includes(stageName)
        ? prev.selectedStages.filter(s => s !== stageName)
        : [...prev.selectedStages, stageName]
    }));
  };

  // Get all available stages (default + custom)
  const getAllAvailableStages = () => {
    try {
      const saved = localStorage.getItem('mutabile_default_activities');
      if (saved) {
        const stageActivities = JSON.parse(saved);
        return stageActivities.map((sa: any) => sa.stageName);
      }
    } catch (error) {
      console.error('Error loading available stages:', error);
    }
    return defaultStages.map(s => s.name);
  };

  const getStageActivitiesCount = (stageName: string) => {
    try {
      const saved = localStorage.getItem('mutabile_default_activities');
      if (saved) {
        const stageActivities = JSON.parse(saved);
        const stageData = stageActivities.find((sa: any) => sa.stageName === stageName);
        return stageData?.activities?.length || 0;
      }
    } catch (error) {
      console.error('Error loading stage activities count:', error);
    }
    return 0;
  };

  const addCustomStage = (stageName: string) => {
    try {
      const saved = localStorage.getItem('mutabile_default_activities');
      const stageActivities = saved ? JSON.parse(saved) : [];
      
      // Check if stage already exists
      if (stageActivities.some((sa: any) => sa.stageName === stageName)) {
        toast.warning('Etapa já existe', `A etapa "${stageName}" já foi criada anteriormente.`);
        return;
      }
      
      // Add new stage with empty activities
      const newStageData = {
        stageName: stageName,
        activities: []
      };
      
      const updatedStageActivities = [...stageActivities, newStageData];
      localStorage.setItem('mutabile_default_activities', JSON.stringify(updatedStageActivities));
      
      // Automatically select the new stage
      setFormData(prev => ({
        ...prev,
        selectedStages: [...prev.selectedStages, stageName]
      }));
      
      toast.success(`Etapa "${stageName}" criada com sucesso!`, 'Você pode configurar suas atividades padrão em Configurações → Atividades Padrão.');
    } catch (error) {
      console.error('Error adding custom stage:', error);
      toast.error('Erro ao criar etapa personalizada');
    }
  };

  const deleteCustomStage = async (stageName: string) => {
    const confirmed = await confirm({
      title: 'Excluir Etapa Personalizada',
      message: `Tem certeza que deseja excluir a etapa "${stageName}"? Esta ação removerá a etapa de todos os projetos futuros, mas não afetará projetos já existentes.`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      try {
        const saved = localStorage.getItem('mutabile_default_activities');
        if (saved) {
          const stageActivities = JSON.parse(saved);
          const updatedStageActivities = stageActivities.filter((sa: any) => sa.stageName !== stageName);
          localStorage.setItem('mutabile_default_activities', JSON.stringify(updatedStageActivities));
          
          // Remove from selected stages if it was selected
          setFormData(prev => ({
            ...prev,
            selectedStages: prev.selectedStages.filter(s => s !== stageName)
          }));
          
          toast.success(`Etapa "${stageName}" excluída com sucesso!`);
        }
      } catch (error) {
        console.error('Error deleting custom stage:', error);
        toast.error('Erro ao excluir etapa personalizada');
      }
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={project ? 'Editar Projeto' : 'Novo Projeto'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Projeto *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <input
              type="text"
              required
              value={formData.client}
              onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Local *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsável *
            </label>
            {project && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Atenção:</strong> Alterar as etapas de um projeto existente pode afetar as atividades já cadastradas.
                </p>
              </div>
            )}
            <select
              required
              value={formData.responsible}
              onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            >
              <option value="">Selecione um responsável</option>
              {users.map(user => (
                <option key={user.id} value={user.name}>
                  {user.name} - {user.role}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Controle
          </label>
          <input
            type="text"
            value={formData.controlNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, controlNumber: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Etapas do Projeto
          </label>
          
          {/* Add Custom Stage Section */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Adicionar Nova Etapa</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCustomStageModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Etapa Personalizada
              </Button>
            </div>
            <p className="text-xs text-gray-600">
              Você pode criar etapas personalizadas que serão salvas para uso em futuros projetos.
              As atividades padrão para essas etapas podem ser configuradas em <strong>Configurações → Atividades Padrão</strong>.
            </p>
          </div>
          
          {/* Available Stages List */}
          <div className="space-y-3 mb-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {getAllAvailableStages().map(stageName => {
              const isDefaultStage = defaultStages.some(ds => ds.name === stageName);
              const stageActivities = getStageActivitiesCount(stageName);
              
              return (
                <label key={stageName} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      checked={formData.selectedStages.includes(stageName)}
                      onChange={() => toggleStage(stageName)}
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{stageName}</span>
                        {!isDefaultStage && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Personalizada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {stageActivities} atividade{stageActivities !== 1 ? 's' : ''} padrão configurada{stageActivities !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {!isDefaultStage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteCustomStage(stageName);
                      }}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      title="Excluir etapa personalizada"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </label>
              );
            })}
            
            {getAllAvailableStages().length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-3">Nenhuma etapa disponível.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomStageModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Etapa
                </Button>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            Selecione as etapas que farão parte deste projeto. As atividades padrão serão criadas automaticamente.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {project ? 'Salvar Alterações' : 'Criar Projeto'}
          </Button>
        </div>
      </form>
    </Modal>
      
      <CustomStageModal
        isOpen={showCustomStageModal}
        onClose={() => setShowCustomStageModal(false)}
        onAdd={addCustomStage}
      />
    </>
  );
}