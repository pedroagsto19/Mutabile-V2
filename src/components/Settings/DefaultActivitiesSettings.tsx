import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, List, Clock, User, AlertCircle } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { Modal } from '../UI/Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { defaultStages } from '../../data/mockData';
import { defaultActivityOperations } from '../../lib/database';
import { generateUUID } from '../../utils/id';

interface DefaultActivity {
  id: string;
  title: string;
  description: string;
  plannedDuration: number; // hours
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dependencies: Array<{
    id: string;
    dependsOn: string;
    type: 'finish_start' | 'start_start' | 'finish_finish' | 'start_finish';
  }>;
  checklist: Array<{
    id: string;
    title: string;
  }>;
  driveLinks: Array<{
    id: string;
    title: string;
    url: string;
    description?: string;
  }>;
}

interface StageDefaultActivities {
  stageName: string;
  activities: DefaultActivity[];
}

export function DefaultActivitiesSettings() {
  const { getAllUsers } = useAuth();
  const { toast, confirm } = useNotification();
  const users = getAllUsers();
  
  const [stageActivities, setStageActivities] = useState<StageDefaultActivities[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<DefaultActivity | null>(null);
  const [showNewStageForm, setShowNewStageForm] = useState(false);
  const [newStageName, setNewStageName] = useState('');

  // Load default activities from localStorage
  useEffect(() => {
    loadDefaultActivities();
  }, []);

  const loadDefaultActivities = () => {
    defaultActivityOperations.getAll()
      .then(setStageActivities)
      .catch(error => {
        console.error('Error loading default activities:', error);
        toast.error('Erro ao carregar atividades padrão');
      });
  };



  const saveDefaultActivities = (data: StageDefaultActivities[]) => {
    setStageActivities(data);
    toast.success('Atividades padrão salvas com sucesso!');
  };

  const getCurrentStageActivities = () => {
    return stageActivities.find(sa => sa.stageName === selectedStage)?.activities || [];
  };

  const addActivity = (activityData: Omit<DefaultActivity, 'id'>) => {
    defaultActivityOperations.create(selectedStage, activityData)
      .then(() => {
        loadDefaultActivities();
        toast.success('Atividade padrão criada com sucesso!');
      })
      .catch(error => {
        console.error('Error creating default activity:', error);
        toast.error('Erro ao criar atividade padrão');
      });
  };

  const updateActivity = (activityId: string, updates: Partial<DefaultActivity>) => {
    defaultActivityOperations.update(activityId, updates)
      .then(() => {
        loadDefaultActivities();
        toast.success('Atividade padrão atualizada com sucesso!');
      })
      .catch(error => {
        console.error('Error updating default activity:', error);
        toast.error('Erro ao atualizar atividade padrão');
      });
  };

  const deleteActivity = async (activityId: string) => {
    const confirmed = await confirm({
      title: 'Excluir Atividade Padrão',
      message: 'Tem certeza que deseja excluir esta atividade padrão? Esta ação não afetará projetos já criados.',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      defaultActivityOperations.delete(activityId)
        .then(() => {
          loadDefaultActivities();
          toast.success('Atividade padrão excluída com sucesso!');
        })
        .catch(error => {
          console.error('Error deleting default activity:', error);
          toast.error('Erro ao excluir atividade padrão');
        });
    }
  };

  const addNewStage = () => {
    if (newStageName.trim()) {
      const updatedStageActivities = [
        ...stageActivities,
        {
          stageName: newStageName.trim(),
          activities: []
        }
      ];
      saveDefaultActivities(updatedStageActivities);
      setSelectedStage(newStageName.trim());
      setNewStageName('');
      setShowNewStageForm(false);
      toast.success(`Etapa "${newStageName.trim()}" criada com sucesso!`);
    }
  };

  const deleteStage = async (stageName: string) => {
    const confirmed = await confirm({
      title: 'Excluir Etapa',
      message: `Tem certeza que deseja excluir a etapa "${stageName}" e todas suas atividades padrão?`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      const updatedStageActivities = stageActivities.filter(sa => sa.stageName !== stageName);
      saveDefaultActivities(updatedStageActivities);
      if (selectedStage === stageName) {
        setSelectedStage('');
      }
      toast.success(`Etapa "${stageName}" excluída com sucesso!`);
    }
  };

  const ActivityForm = () => {
    const [formData, setFormData] = useState({
      title: editingActivity?.title || '',
      description: editingActivity?.description || '',
      plannedDuration: editingActivity?.plannedDuration || 8,
      priority: editingActivity?.priority || 'medium' as const,
      checklist: editingActivity?.checklist || [],
      dependencies: editingActivity?.dependencies || [],
      driveLinks: editingActivity?.driveLinks || []
    });
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [newDriveLink, setNewDriveLink] = useState({
      title: '',
      url: '',
      description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (editingActivity) {
        updateActivity(editingActivity.id, formData);
      } else {
        addActivity(formData);
      }
      
      setShowActivityForm(false);
      setEditingActivity(null);
    };

    const addChecklistItem = () => {
      if (newChecklistItem.trim()) {
        const newItem = {
          id: generateUUID(),
          title: newChecklistItem.trim()
        };
        setFormData(prev => ({
          ...prev,
          checklist: [...prev.checklist, newItem]
        }));
        setNewChecklistItem('');
      }
    };

    const removeChecklistItem = (itemId: string) => {
      setFormData(prev => ({
        ...prev,
        checklist: prev.checklist.filter(item => item.id !== itemId)
      }));
    };

    const addDriveLink = () => {
      if (newDriveLink.title.trim() && newDriveLink.url.trim()) {
        const newLink = {
          id: generateUUID(),
          title: newDriveLink.title.trim(),
          url: newDriveLink.url.trim(),
          description: newDriveLink.description.trim() || undefined
        };
        setFormData(prev => ({
          ...prev,
          driveLinks: [...prev.driveLinks, newLink]
        }));
        setNewDriveLink({ title: '', url: '', description: '' });
      }
    };

    const removeDriveLink = (linkId: string) => {
      setFormData(prev => ({
        ...prev,
        driveLinks: prev.driveLinks.filter(link => link.id !== linkId)
      }));
    };

    const toggleDependency = (activityId: string) => {
      setFormData(prev => ({
        ...prev,
        dependencies: prev.dependencies.some(dep => dep.dependsOn === activityId)
          ? prev.dependencies.filter(dep => dep.dependsOn !== activityId)
          : [...prev.dependencies, {
              id: generateUUID(),
              dependsOn: activityId,
              type: 'finish_start'
            }]
      }));
    };

    return (
      <Modal 
        isOpen={showActivityForm} 
        onClose={() => {
          setShowActivityForm(false);
          setEditingActivity(null);
        }} 
        title={editingActivity ? 'Editar Atividade Padrão' : 'Nova Atividade Padrão'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              placeholder="Ex: Levantamento topográfico"
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
              placeholder="Descreva o que deve ser feito nesta atividade..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duração Planejada (horas)
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.plannedDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, plannedDuration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          {/* Checklist Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sub-etapas Padrão (Checklist)
            </label>
            
            {/* Add new checklist item */}
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                placeholder="Digite uma sub-etapa..."
              />
              <Button
                type="button"
                onClick={addChecklistItem}
                disabled={!newChecklistItem.trim()}
                size="sm"
              >
                Adicionar
              </Button>
            </div>
            
            {/* Checklist items */}
            {formData.checklist.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                {formData.checklist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <span className="text-sm text-gray-700 flex-1">
                      • {item.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-sm transition-opacity"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {formData.checklist.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                Nenhuma sub-etapa adicionada. Use o campo acima para adicionar itens do checklist.
              </p>
            )}
          </div>

          {/* Dependencies Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dependências
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {getCurrentStageActivities()
                .filter(activity => activity.id !== editingActivity?.id)
                .map(activity => (
                  <label key={activity.id} className="flex items-center mb-2 last:mb-0">
                    <input
                      type="checkbox"
                      checked={formData.dependencies.some(dep => dep.dependsOn === activity.id)}
                      onChange={() => toggleDependency(activity.id)}
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {activity.title}
                    </span>
                  </label>
                ))}
              {getCurrentStageActivities().filter(activity => activity.id !== editingActivity?.id).length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  Nenhuma outra atividade disponível nesta etapa para criar dependências.
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selecione as atividades que devem ser concluídas antes desta começar.
            </p>
          </div>

          {/* Drive Links Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Links para Modelos (Drive)
            </label>
            
            {/* Add new drive link */}
            <div className="space-y-3 mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newDriveLink.title}
                  onChange={(e) => setNewDriveLink(prev => ({ ...prev, title: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  placeholder="Nome do modelo..."
                />
                <input
                  type="url"
                  value={newDriveLink.url}
                  onChange={(e) => setNewDriveLink(prev => ({ ...prev, url: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <input
                type="text"
                value={newDriveLink.description}
                onChange={(e) => setNewDriveLink(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                placeholder="Descrição do modelo (opcional)..."
              />
              <Button
                type="button"
                onClick={addDriveLink}
                disabled={!newDriveLink.title.trim() || !newDriveLink.url.trim()}
                size="sm"
              >
                Adicionar Link
              </Button>
            </div>
            
            {/* Drive links list */}
            {formData.driveLinks.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                {formData.driveLinks.map((link) => (
                  <div key={link.id} className="flex items-start justify-between group bg-white p-2 rounded border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {link.title}
                        </span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Abrir
                        </a>
                      </div>
                      {link.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {link.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDriveLink(link.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-sm transition-opacity ml-2"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {formData.driveLinks.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                Nenhum link adicionado. Use o formulário acima para adicionar links para modelos do Drive.
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowActivityForm(false);
                setEditingActivity(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingActivity ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    );
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  return (
    <div className="space-y-6">
      <ActivityForm />
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Atividades Padrão
        </h1>
        <p className="text-gray-600 mt-1">
          Configure atividades que serão automaticamente criadas em novos projetos
        </p>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Como funciona</h3>
            <p className="text-sm text-blue-700 mt-1">
              As atividades configuradas aqui serão automaticamente adicionadas quando você criar um novo projeto 
              que contenha a etapa correspondente. Projetos já existentes não serão afetados por mudanças nestas configurações.
            </p>
          </div>
        </div>
      </div>

      {/* Stage Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Gerenciar Etapas</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewStageForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Etapa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* New Stage Form */}
          {showNewStageForm && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-3">Criar Nova Etapa</h3>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNewStage()}
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Nome da nova etapa..."
                  autoFocus
                />
                <Button
                  onClick={addNewStage}
                  disabled={!newStageName.trim()}
                  size="sm"
                >
                  Criar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewStageForm(false);
                    setNewStageName('');
                  }}
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Stage Selection Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Etapa para Configurar
            </label>
            <div className="space-y-2">
              {stageActivities.map(stageData => {
                const activityCount = stageData.activities.length;
                const isSelected = selectedStage === stageData.stageName;
                
                return (
                  <div
                    key={stageData.stageName}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedStage(isSelected ? '' : stageData.stageName)}
                  >
                    <div>
                      <h3 className={`font-medium text-sm ${
                        isSelected ? 'text-white' : 'text-gray-900'
                      }`}>
                        {stageData.stageName}
                      </h3>
                      <p className={`text-xs ${
                        isSelected ? 'text-gray-200' : 'text-gray-500'
                      }`}>
                        {activityCount} atividade{activityCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStage(stageData.stageName);
                        }}
                        className={`p-1 rounded transition-colors ${
                          isSelected 
                            ? 'text-red-200 hover:text-red-100 hover:bg-red-600' 
                            : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                        }`}
                        title="Excluir etapa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {stageActivities.length === 0 && (
                <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-gray-500">Nenhuma etapa configurada ainda.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Use o botão "Nova Etapa" acima para criar a primeira etapa.
                  </p>
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Activities for Selected Stage */}
      {selectedStage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Atividades Padrão - {selectedStage}
                </h2>
                <p className="text-sm text-gray-600">
                  {getCurrentStageActivities().length} atividade{getCurrentStageActivities().length !== 1 ? 's' : ''} configurada{getCurrentStageActivities().length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button onClick={() => setShowActivityForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Atividade
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {getCurrentStageActivities().length > 0 ? (
              <div className="space-y-4">
                {getCurrentStageActivities().map((activity) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{activity.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(activity.priority)}`}>
                            {getPriorityLabel(activity.priority)}
                          </span>
                        </div>
                        
                        {activity.description && (
                          <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{activity.plannedDuration}h planejadas</span>
                          </div>
                          {activity.checklist.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <List className="h-4 w-4" />
                              <span>{activity.checklist.length} sub-etapa{activity.checklist.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                        
                        {activity.checklist.length > 0 && (
                          <div className="mt-3 bg-gray-50 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Sub-etapas:</h4>
                            <div className="space-y-1">
                              {activity.checklist.map((item) => (
                                <div key={item.id} className="text-sm text-gray-700">
                                  • {item.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Dependencies Display */}
                        {activity.dependencies && activity.dependencies.length > 0 && (
                          <div className="mt-3 bg-purple-50 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Dependências:</h4>
                            <div className="space-y-1">
                              {activity.dependencies.map((dep) => {
                                const depActivity = getCurrentStageActivities().find(a => a.id === dep.dependsOn);
                                return depActivity ? (
                                  <div key={dep.id} className="text-sm text-gray-700">
                                    • {depActivity.title}
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Drive Links Display */}
                        {activity.driveLinks && activity.driveLinks.length > 0 && (
                          <div className="mt-3 bg-blue-50 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Links para Modelos:</h4>
                            <div className="space-y-2">
                              {activity.driveLinks.map((link) => (
                                <div key={link.id} className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-gray-900 truncate">
                                        {link.title}
                                      </span>
                                      <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                      >
                                        Abrir Drive
                                      </a>
                                    </div>
                                    {link.description && (
                                      <p className="text-xs text-gray-500 mt-1 truncate">
                                        {link.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingActivity(activity);
                            setShowActivityForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteActivity(activity.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  Nenhuma atividade padrão configurada para {selectedStage}.
                </p>
                <Button onClick={() => setShowActivityForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira atividade
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedStage && (
        <div className="text-center py-12">
          <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            Selecione uma etapa acima para configurar suas atividades padrão.
          </p>
        </div>
      )}
    </div>
  );
}