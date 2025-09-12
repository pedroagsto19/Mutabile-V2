import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, List, Clock, User, AlertCircle } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { Modal } from '../UI/Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { defaultStages } from '../../data/mockData';

interface DefaultActivity {
  id: string;
  title: string;
  description: string;
  plannedDuration: number; // hours
  priority: 'low' | 'medium' | 'high' | 'urgent';
  checklist: Array<{
    id: string;
    title: string;
  }>;
}

interface StageDefaultActivities {
  stageName: string;
  activities: DefaultActivity[];
}

const STORAGE_KEY = 'mutabile_default_activities';

export function DefaultActivitiesSettings() {
  const { getAllUsers } = useAuth();
  const { toast, confirm } = useNotification();
  const users = getAllUsers();
  
  const [stageActivities, setStageActivities] = useState<StageDefaultActivities[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<DefaultActivity | null>(null);

  // Load default activities from localStorage
  useEffect(() => {
    loadDefaultActivities();
  }, []);

  const loadDefaultActivities = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setStageActivities(JSON.parse(saved));
      } else {
        // Initialize with default stages
        const initialData = defaultStages.map(stage => ({
          stageName: stage.name,
          activities: []
        }));
        setStageActivities(initialData);
      }
    } catch (error) {
      console.error('Error loading default activities:', error);
      toast.error('Erro ao carregar atividades padrão');
    }
  };

  const saveDefaultActivities = (data: StageDefaultActivities[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStageActivities(data);
      toast.success('Atividades padrão salvas com sucesso!');
    } catch (error) {
      console.error('Error saving default activities:', error);
      toast.error('Erro ao salvar atividades padrão');
    }
  };

  const getCurrentStageActivities = () => {
    return stageActivities.find(sa => sa.stageName === selectedStage)?.activities || [];
  };

  const addActivity = (activityData: Omit<DefaultActivity, 'id'>) => {
    const newActivity: DefaultActivity = {
      ...activityData,
      id: Date.now().toString()
    };

    const updatedStageActivities = stageActivities.map(sa => 
      sa.stageName === selectedStage 
        ? { ...sa, activities: [...sa.activities, newActivity] }
        : sa
    );

    saveDefaultActivities(updatedStageActivities);
  };

  const updateActivity = (activityId: string, updates: Partial<DefaultActivity>) => {
    const updatedStageActivities = stageActivities.map(sa => 
      sa.stageName === selectedStage 
        ? {
            ...sa, 
            activities: sa.activities.map(activity => 
              activity.id === activityId ? { ...activity, ...updates } : activity
            )
          }
        : sa
    );

    saveDefaultActivities(updatedStageActivities);
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
      const updatedStageActivities = stageActivities.map(sa => 
        sa.stageName === selectedStage 
          ? { ...sa, activities: sa.activities.filter(activity => activity.id !== activityId) }
          : sa
      );

      saveDefaultActivities(updatedStageActivities);
    }
  };

  const ActivityForm = () => {
    const [formData, setFormData] = useState({
      title: editingActivity?.title || '',
      description: editingActivity?.description || '',
      plannedDuration: editingActivity?.plannedDuration || 8,
      priority: editingActivity?.priority || 'medium' as const,
      checklist: editingActivity?.checklist || []
    });
    const [newChecklistItem, setNewChecklistItem] = useState('');

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
          id: Date.now().toString(),
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
          <h2 className="text-lg font-semibold text-gray-900">Selecionar Etapa</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {defaultStages.map(stage => {
              const stageData = stageActivities.find(sa => sa.stageName === stage.name);
              const activityCount = stageData?.activities.length || 0;
              
              return (
                <button
                  key={stage.name}
                  onClick={() => setSelectedStage(stage.name)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedStage === stage.name
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{stage.name}</div>
                  <div className={`text-sm mt-1 ${
                    selectedStage === stage.name ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {activityCount} atividade{activityCount !== 1 ? 's' : ''}
                  </div>
                </button>
              );
            })}
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