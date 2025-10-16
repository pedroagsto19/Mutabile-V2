import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Plus, X } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useClient } from '../../context/ClientContext';
import { useConfirm } from '../../hooks/useConfirm';
import type { Project } from '../../types';
import { defaultActivityOperations } from '../../lib/database';

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
  const { clients } = useClient();
  const { toast, confirm } = useNotification();
  const users = getAllUsers();
  const [showCustomStageModal, setShowCustomStageModal] = useState(false);
  const [defaultStages, setDefaultStages] = useState<Array<{name: string, isCustom: boolean}>>([]);
  const [defaultActivitiesByStage, setDefaultActivitiesByStage] = useState<Map<string, any[]>>(new Map());
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);

  const [formData, setFormData] = useState({
    name: project?.name || '',
    client: project?.client || '',
    location: project?.location || '',
    responsible: project?.responsible || '',
    controlNumber: project?.controlNumber || '',
    description: project?.description || '',
    status: project?.status || 'planning' as const,
    selectedStages: project?.stages.map(s => s.name) || []
  });
  const [customStagesCreatedInForm, setCustomStagesCreatedInForm] = useState<string[]>([]);

  useEffect(() => {
    const loadDefaults = async () => {
      try {
        setIsLoadingDefaults(true);
        const defaultActivitiesData = await defaultActivityOperations.getAll();
        console.log('Raw data from defaultActivityOperations.getAll():', defaultActivitiesData);

        const stageNames = [...new Set(defaultActivitiesData.map(d => d.stageName))];
        const stages = stageNames.map(name => ({ name, isCustom: false }));
        console.log('Extracted stages:', stages);
        setDefaultStages(stages);

        const activitiesMap = new Map();
        defaultActivitiesData.forEach(stageData => {
          console.log(`Setting activities for stage "${stageData.stageName}":`, stageData.activities);
          activitiesMap.set(stageData.stageName, stageData.activities);
        });
        console.log('Final activitiesMap:', Array.from(activitiesMap.entries()));
        setDefaultActivitiesByStage(activitiesMap);

        if (!project && formData.selectedStages.length === 0 && stages.length > 0) {
          setFormData(prev => ({ ...prev, selectedStages: [stages[0].name] }));
        }
      } catch (error) {
        console.error('Error loading default stages and activities:', error);
        toast.error('Erro ao carregar etapas padrão');
      } finally {
        setIsLoadingDefaults(false);
      }
    };

    loadDefaults();
  }, []);

  useEffect(() => {
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

  // Get clients that have completed the sales funnel (status: 'closed')
  const availableClients = clients.filter(client => client.funnelStage === 'closed');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allStages = formData.selectedStages;

    const loadDefaultActivities = (stageName: string) => {
      const activities = defaultActivitiesByStage.get(stageName) || [];
      console.log(`loadDefaultActivities("${stageName}"):`, activities);
      console.log('defaultActivitiesByStage Map:', Array.from(defaultActivitiesByStage.entries()));
      return activities;
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
      stages = allStages.map((stageName, index) => {
        const defaultActivitiesForStage = loadDefaultActivities(stageName);
        console.log(`Loading default activities for stage "${stageName}":`, defaultActivitiesForStage);

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: stageName,
          projectId: '',
          order: index + 1,
          progress: 0,
          status: 'not_started' as const,
          activities: defaultActivitiesForStage.map((defaultActivity: any) => ({
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
            checklist: (defaultActivity.checklist || []).map((item: any) => ({
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
          })),
          notificationRecipients: [],
          isCustom: !defaultStages.some(ds => ds.name === stageName)
        };
      });
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
        selectedStages: defaultStages.length > 0 ? [defaultStages[0].name] : []
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
      // Retorna apenas as etapas básicas - as personalizadas vêm do banco
      return defaultStages.map(s => s.name);
    } catch (error) {
      console.error('Error loading available stages:', error);
    }
    return defaultStages.map(s => s.name);
  };

  const getStageActivitiesCount = (stageName: string) => {
    try {
      // Contagem será feita via consulta ao banco
      return 0; // Placeholder - será implementado com consulta real
    } catch (error) {
      console.error('Error loading stage activities count:', error);
    }
    return 0;
  };

  const addCustomStage = (stageName: string) => {
    // Check if stage already exists in global stages or project-specific stages
    const globalStages = getAllAvailableStages();
    const allProjectStages = [...globalStages, ...customStagesCreatedInForm];
    
    if (allProjectStages.includes(stageName)) {
      toast.warning('Etapa já existe', `A etapa "${stageName}" já foi criada.`);
      return;
    }
    
    // Add to project-specific stages (NOT to global configurations)
    setCustomStagesCreatedInForm(prev => [...prev, stageName]);
    
    // Automatically select the new stage
    setFormData(prev => ({
      ...prev,
      selectedStages: [...prev.selectedStages, stageName]
    }));
    
    toast.success(`Etapa "${stageName}" criada!`, 'Esta etapa é específica deste projeto.');
  };

  const deleteCustomStage = async (stageName: string) => {
    // Only allow deletion of stages created in this form session
    if (!customStagesCreatedInForm.includes(stageName)) {
      toast.warning('Ação não permitida', 'Esta etapa só pode ser removida através das Configurações → Atividades Padrão.');
      return;
    }
    
    const confirmed = await confirm({
      title: 'Excluir Etapa Personalizada',
      message: `Tem certeza que deseja excluir a etapa "${stageName}"?`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      // Remove from project-specific stages only
      setCustomStagesCreatedInForm(prev => prev.filter(s => s !== stageName));
      
      // Remove from selected stages if it was selected
      setFormData(prev => ({
        ...prev,
        selectedStages: prev.selectedStages.filter(s => s !== stageName)
      }));
      
      toast.success(`Etapa "${stageName}" removida!`);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={project ? 'Editar Projeto' : 'Novo Projeto'} size="xl">
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
              <select
                required
                value={formData.client}
                onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              >
                <option value="">Selecione um cliente</option>
                {availableClients.map(client => (
                  <option key={client.id} value={client.name}>
                    {client.name} - {client.documentType.toUpperCase()}: {client.document}
                  </option>
                ))}
              </select>
              {availableClients.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Nenhum cliente disponível!</strong>
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Para criar um projeto, você precisa ter clientes com status "Fechado" no funil de vendas.
                    Vá para <strong>Cadastro de Clientes</strong> para cadastrar e gerenciar o funil de vendas.
                  </p>
                </div>
              )}
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
            
            {/* Stage Selection Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {/* Global stages from configurations */}
              {getAllAvailableStages().map(stageName => {
                const isSelected = formData.selectedStages.includes(stageName);
                const stageActivities = getStageActivitiesCount(stageName);
                
                return (
                  <div
                    key={stageName}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => toggleStage(stageName)}
                  >
                    <div className="text-center">
                      <h3 className={`font-medium text-sm ${
                        isSelected ? 'text-white' : 'text-gray-900'
                      }`}>
                        {stageName}
                      </h3>
                    </div>
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Project-specific custom stages */}
              {customStagesCreatedInForm.map(stageName => {
                const isSelected = formData.selectedStages.includes(stageName);
                
                return (
                  <div
                    key={`custom-${stageName}`}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => toggleStage(stageName)}
                  >
                    <div className="text-center">
                      <h3 className={`font-medium text-sm ${
                        isSelected ? 'text-white' : 'text-gray-900'
                      }`}>
                        {stageName}
                      </h3>
                      
                      {/* Custom stage indicators */}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isSelected 
                            ? 'bg-white bg-opacity-20 text-white' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          Personalizada
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomStage(stageName);
                          }}
                          className={`text-xs hover:text-red-600 transition-colors ${
                            isSelected ? 'text-red-200' : 'text-red-500'
                          }`}
                          title="Excluir etapa personalizada"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <p className="text-xs text-gray-500 mb-4">
              Selecione as etapas que farão parte deste projeto. Atividades padrão serão automaticamente adicionadas.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={availableClients.length === 0}>
              {project ? 'Atualizar Projeto' : 'Criar Projeto'}
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