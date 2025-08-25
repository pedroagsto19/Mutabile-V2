import React, { useState } from 'react';
import { ArrowLeft, Edit, MapPin, Globe, Phone, Mail, Building, Plus, Calendar, User } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { SupplierForm } from './SupplierForm';
import { SupplierEvaluationForm } from './SupplierEvaluationForm';
import { useSupplier } from '../../context/SupplierContext';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SupplierDetailProps {
  supplierId: string;
  onBack: () => void;
}

export function SupplierDetail({ supplierId, onBack }: SupplierDetailProps) {
  const { suppliers, canEditSupplier } = useSupplier();
  const { projects } = useProject();
  const { getAllUsers } = useAuth();
  const users = getAllUsers();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);

  const supplier = suppliers.find(s => s.id === supplierId);
  
  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Fornecedor não encontrado.</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const renderRating = (rating: number, emoji: string) => {
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`text-xl ${i < rating ? 'opacity-100' : 'opacity-30'}`}
            style={{ marginRight: '0.25rem' }}
          >
            {emoji}
          </span>
        ))}
        <span className="ml-2 text-sm font-medium text-gray-900">
          {rating}/5
        </span>
      </div>
    );
  };

  const getAverageRating = () => {
    const total = supplier.ratings.quality + supplier.ratings.price + supplier.ratings.recommendation;
    return total / 3;
  };

  const getLinkedProjects = () => {
    return supplier.linkedProjects
      .map(id => projects.find(p => p.id === id))
      .filter(Boolean);
  };

  const linkedProjects = getLinkedProjects();
  const avgRating = getAverageRating();
  
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Usuário não encontrado';
  };
  
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Projeto não encontrado';
  };

  return (
    <div className="space-y-6">
      <SupplierForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        supplier={supplier}
      />
      
      <SupplierEvaluationForm
        isOpen={showEvaluationForm}
        onClose={() => setShowEvaluationForm(false)}
        supplierId={supplierId}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {supplier.name}
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center">
                {renderRating(Math.round(avgRating), '⭐')}
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {avgRating.toFixed(1)} (média de {supplier.evaluations.length} avaliações)
                </span>
              </div>
            </div>
          </div>
        </div>
        {canEditSupplier() && (
          <Button onClick={() => setShowEditForm(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Fornecedor
          </Button>
        )}
        <Button onClick={() => setShowEvaluationForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Avaliação
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {supplier.cnpj && (
                  <div>
                    <p className="text-sm text-gray-500">CNPJ</p>
                    <p className="font-medium">{supplier.cnpj}</p>
                  </div>
                )}
                
                {(supplier.location.city || supplier.location.state || supplier.location.country) && (
                  <div>
                    <p className="text-sm text-gray-500">Localização</p>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      <div>
                        {supplier.location.city && <span>{supplier.location.city}</span>}
                        {supplier.location.city && supplier.location.state && <span>, </span>}
                        {supplier.location.state && <span>{supplier.location.state}</span>}
                        {(supplier.location.city || supplier.location.state) && supplier.location.country && <span>, </span>}
                        {supplier.location.country && <span>{supplier.location.country}</span>}
                      </div>
                    </div>
                  </div>
                )}
                
                {supplier.website && (
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-1 text-gray-400" />
                      <a 
                        href={supplier.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {supplier.website}
                      </a>
                    </div>
                  </div>
                )}
                
                {supplier.mainContact && (
                  <div>
                    <p className="text-sm text-gray-500">Contato Principal</p>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1 text-gray-400" />
                      <p className="font-medium">{supplier.mainContact}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {supplier.description && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-2">Descrição</p>
                  <p className="text-gray-900">{supplier.description}</p>
                </div>
              )}
              
              {supplier.observations && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-2">Observações</p>
                  <p className="text-gray-900">{supplier.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects Section */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Obras que trabalhamos juntos
              </h2>
            </CardHeader>
            <CardContent>
              {linkedProjects.length > 0 ? (
                <div className="space-y-4">
                  {linkedProjects.map(project => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-500">{project.client}</p>
                          <p className="text-sm text-gray-500">{project.location}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            project.status === 'completed' ? 'bg-green-100 text-green-800' :
                            project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status === 'completed' ? 'Concluído' :
                             project.status === 'in_progress' ? 'Em Andamento' :
                             project.status === 'on_hold' ? 'Pausado' : 'Planejamento'}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            {project.progress}% concluído
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum projeto vinculado ainda.</p>
                  {canEditSupplier() && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowEditForm(true)}
                    >
                      Vincular Projetos
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ratings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Avaliação Atual</h2>
                <span className="text-sm text-gray-500">
                  Média de {supplier.evaluations.length} avaliações
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Qualidade</p>
                  {renderRating(supplier.ratings.quality, '👍')}
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Preço</p>
                  {renderRating(supplier.ratings.price, '💰')}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Índice de Indicação</p>
                  {renderRating(supplier.ratings.recommendation, '⭐')}
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Média Geral</p>
                  <div className="flex items-center">
                    {renderRating(Math.round(avgRating), '⭐')}
                    <span className="ml-2 text-lg font-bold text-gray-900">
                      {avgRating.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Evaluation History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Histórico de Avaliações</h2>
                <Button size="sm" onClick={() => setShowEvaluationForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Avaliação
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {supplier.evaluations.length > 0 ? (
                <div className="space-y-4">
                  {supplier.evaluations
                    .sort((a, b) => b.evaluationDate.getTime() - a.evaluationDate.getTime())
                    .map((evaluation) => (
                    <div key={evaluation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {format(evaluation.evaluationDate, 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          {evaluation.projectId && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-sm text-gray-600">
                                {getProjectName(evaluation.projectId)}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <User className="h-3 w-3 mr-1" />
                          {getUserName(evaluation.evaluatedBy)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Qualidade</p>
                          {renderRating(evaluation.ratings.quality, '👍')}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Preço</p>
                          {renderRating(evaluation.ratings.price, '💰')}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Indicabilidade</p>
                          <p className="text-xs text-gray-500 mb-1">Índice de Indicação</p>
                          {renderRating(evaluation.ratings.recommendation, '⭐')}
                        </div>
                      </div>
                      
                      {evaluation.notes && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">{evaluation.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nenhuma avaliação registrada ainda.</p>
                  <Button onClick={() => setShowEvaluationForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Fazer primeira avaliação
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Estatísticas</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Projetos vinculados</span>
                  <span className="font-medium">{linkedProjects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Cadastrado em</span>
                  <span className="font-medium">
                    {supplier.createdAt.toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Última atualização</span>
                  <span className="font-medium">
                    {supplier.updatedAt.toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}