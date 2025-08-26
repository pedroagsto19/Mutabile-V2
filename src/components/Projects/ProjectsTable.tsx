import React, { useState } from 'react';
import { Eye, Edit, Trash2, Plus, Filter, Search, BarChart3 } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { ProgressBar } from '../UI/ProgressBar';
import { ProjectForm } from './ProjectForm';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../Auth/ProtectedRoute';
import type { Project } from '../../types';
import type { ProjectFilters } from '../../types';
import { useNotification } from '../../context/NotificationContext';

interface ProjectsTableProps {
  onProjectSelect: (projectId: string) => void;
  onProjectGantt: (projectId: string) => void;
  onCreateProject: () => void;
}

export function ProjectsTable({ onProjectSelect, onProjectGantt, onCreateProject }: ProjectsTableProps) {
  const { projects, deleteProject, updateProject } = useProject();
  const { hasPermission } = useAuth();
  const { toast, confirm } = useNotification();
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const filteredProjects = projects.filter(project => {
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !project.client.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && project.status !== filters.status) return false;
    if (filters.client && project.client !== filters.client) return false;
    if (filters.responsible && project.responsible !== filters.responsible) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      planning: 'Planejamento',
      in_progress: 'Em Andamento',
      on_hold: 'Pausado',
      completed: 'Concluído'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      on_time: 'bg-green-100 text-green-800',
      at_risk: 'bg-yellow-100 text-yellow-800',
      delayed: 'bg-red-100 text-red-800'
    };
    return colors[risk as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRiskLabel = (risk: string) => {
    const labels = {
      on_time: 'No Prazo',
      at_risk: 'Em Risco',
      delayed: 'Atrasado'
    };
    return labels[risk as keyof typeof labels] || risk;
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowEditForm(true);
  };

  const handleDeleteProject = (projectId: string) => {
    confirm({
      title: 'Excluir Projeto',
      message: 'Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    }).then((confirmed) => {
      if (confirmed) {
        try {
          deleteProject(projectId);
          toast.success('Projeto excluído com sucesso!');
        } catch (error) {
          toast.error('Erro ao excluir projeto', 'Tente novamente mais tarde.');
        }
      }
    });
  };

  const handleUpdateProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProject) {
      updateProject(editingProject.id, projectData);
      toast.success('Projeto atualizado com sucesso!');
      setShowEditForm(false);
      setEditingProject(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Edit Project Modal */}
      {showEditForm && editingProject && (
        <ProjectForm
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setEditingProject(null);
          }}
          onSubmit={handleUpdateProject}
          project={editingProject}
        />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Projetos
          </h1>
          <p className="text-gray-600 mt-1">{filteredProjects.length} projetos encontrados</p>
        </div>
        <ProtectedRoute requiredPermission="canCreateProjects">
          <Button onClick={onCreateProject}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </ProtectedRoute>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar projetos..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C58F6] focus:border-[#1C58F6] outline-none"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C58F6] focus:border-[#1C58F6] outline-none"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              >
                <option value="">Todos os Status</option>
                <option value="planning">Planejamento</option>
                <option value="in_progress">Em Andamento</option>
                <option value="on_hold">Pausado</option>
                <option value="completed">Concluído</option>
              </select>
              <input
                type="text"
                placeholder="Filtrar por cliente"
                value={filters.client || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C58F6] focus:border-[#1C58F6] outline-none"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
              <input
                type="text"
                placeholder="Filtrar por responsável"
                value={filters.responsible || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, responsible: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C58F6] focus:border-[#1C58F6] outline-none"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Projects Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projeto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progresso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risco
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-500">{project.controlNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{project.client}</div>
                    <div className="text-sm text-gray-500">{project.location}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {project.responsible}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-20">
                      <ProgressBar value={project.progress} showLabel />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(project.risk)}`}>
                      {getRiskLabel(project.risk)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onProjectSelect(project.id)}
                        title="Ver detalhes do projeto"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onProjectGantt(project.id)}
                        title="Ver cronograma Gantt"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      {hasPermission('canEditProjects') && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditProject(project)}
                          title="Editar projeto"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission('canDeleteProjects') && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          title="Excluir projeto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}