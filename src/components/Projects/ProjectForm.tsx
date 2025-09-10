import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { Plus, X } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import type { Project } from '../../types';
import { defaultStages } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';

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
    <Modal isOpen={isOpen} onClose={handleClose} title="Nova Etapa Personalizada" size="sm">
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
    </Modal>
  );
}
export function ProjectForm({ isOpen, onClose, onSubmit, project }: ProjectFormProps) {
  const { addProject } = useProject();
  const { getAllUsers } = useAuth();
  const { toast } = useNotification();
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
    selectedStages: project?.stages.map(s => s.name) || ['Anteprojeto'],
    customStages: [] as string[]
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
        selectedStages: project.stages.map(s => s.name),
        customStages: []
      });
    }
  }, [project]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine default and custom stages
    const allStages = [...formData.selectedStages, ...formData.customStages];
    
    const stages = allStages.map((stageName, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: stageName,
      projectId: '',
      order: index + 1,
      progress: 0,
      status: 'not_started' as const,
      activities: [],
      notificationRecipients: [],
      isCustom: !defaultStages.some(ds => ds.name === stageName)
    }));

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
      toast.success('Projeto criado com sucesso!');
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
        selectedStages: ['Anteprojeto'],
        customStages: []
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

  const addCustomStage = (stageName: string) => {
    if (!formData.selectedStages.includes(stageName) && !formData.customStages.includes(stageName)) {
      setFormData(prev => ({
        ...prev,
        customStages: [...prev.customStages, stageName]
      }));
    }
  };

  const removeCustomStage = (stageName: string) => {
    setFormData(prev => ({
      ...prev,
      customStages: prev.customStages.filter(s => s !== stageName)
    }));
  };

  return (
    <>
      <CustomStageModal
        isOpen={showCustomStageModal}
        onClose={() => setShowCustomStageModal(false)}
        onAdd={addCustomStage}
      />
      
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
          <div className="space-y-2 mb-3">
            {defaultStages.map(stage => (
              <label key={stage.name} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.selectedStages.includes(stage.name)}
                  onChange={() => toggleStage(stage.name)}
                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{stage.name}</span>
              </label>
            ))}
          </div>
          
          {/* Custom Stages */}
          {formData.customStages.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">Etapas personalizadas:</p>
              <div className="space-y-2">
                {formData.customStages.map(stageName => (
                  <div key={stageName} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                    <span className="text-sm text-blue-800">{stageName}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomStage(stageName)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <Button type="button" variant="outline" size="sm" onClick={() => setShowCustomStageModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Etapa Personalizada
          </Button>
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
    </>
  );
}