import React, { useState } from 'react';
import { ArrowLeft, Edit, MapPin, Mail, Phone, Plus, Calendar, Clock, DollarSign, FileText, Trash2 } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { ClientForm } from './ClientForm';
import { ProposalForm } from './ProposalForm';
import { CommercialActivityForm } from './CommercialActivityForm';
import { FunnelStageSelector } from './FunnelStageSelector';
import { useClient } from '../../context/ClientContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientDetailProps {
  clientId: string;
  onBack: () => void;
}

export function ClientDetail({ clientId, onBack }: ClientDetailProps) {
  const { 
    clients, 
    getClientProposals, 
    getClientActivities, 
    canEditClient,
    canDeleteClient,
    deleteClient
  } = useClient();
  const { getAllUsers } = useAuth();
  const { toast, confirm } = useNotification();
  const users = getAllUsers();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'activities' | 'timeline'>('overview');

  const client = clients.find(c => c.id === clientId);
  const proposals = getClientProposals(clientId);
  const activities = getClientActivities(clientId);
  
  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cliente não encontrado.</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const getFunnelStageColor = (stage: string) => {
    const colors = {
      prospecting: 'bg-gray-100 text-gray-800',
      proposal_sent: 'bg-blue-100 text-blue-800',
      negotiation: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getFunnelStageLabel = (stage: string) => {
    const labels = {
      prospecting: 'Prospecção',
      proposal_sent: 'Proposta Enviada',
      negotiation: 'Negociação',
      closed: 'Fechado',
      lost: 'Perdido'
    };
    return labels[stage as keyof typeof labels] || stage;
  };

  const getProposalStatusColor = (status: string) => {
    const colors = {
      active: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      accepted: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getProposalStatusLabel = (status: string) => {
    const labels = {
      active: 'Ativo',
      paused: 'Pausado',
      rejected: 'Recusado',
      accepted: 'Aceito'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getActivityTypeIcon = (type: string) => {
    const icons = {
      meeting: '🤝',
      call: '📞',
      email: '📧',
      visit: '🏠',
      other: '📝'
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  const getActivityTypeLabel = (type: string) => {
    const labels = {
      meeting: 'Reunião',
      call: 'Ligação',
      email: 'E-mail',
      visit: 'Visita',
      other: 'Outro'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Usuário não encontrado';
  };

  const handleDeleteClient = async (clientId: string) => {
    const confirmed = await confirm({
      title: 'Excluir Cliente',
      message: 'Tem certeza que deseja excluir este cliente? Esta ação também removerá todas as propostas e atividades relacionadas e não pode ser desfeita.',
      type: 'danger',
      confirmText: 'Excluir Cliente',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      try {
        deleteClient(clientId);
        toast.success('Cliente excluído com sucesso!');
        onBack(); // Volta para a lista após excluir
      } catch (error: any) {
        toast.error('Erro ao excluir cliente', error.message || 'Tente novamente mais tarde.');
      }
    }
  };

  const totalProposalValue = proposals
    .filter(p => p.status === 'active' || p.status === 'accepted')
    .reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="space-y-6">
      <ClientForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        client={client}
      />
      
      <ProposalForm
        isOpen={showProposalForm}
        onClose={() => setShowProposalForm(false)}
        clientId={clientId}
      />
      
      <CommercialActivityForm
        isOpen={showActivityForm}
        onClose={() => setShowActivityForm(false)}
        clientId={clientId}
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
              {client.name}
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFunnelStageColor(client.funnelStage)}`}>
                {getFunnelStageLabel(client.funnelStage)}
              </span>
              <span className="text-sm text-gray-500">
                {client.documentType.toUpperCase()}: {client.document}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {canEditClient() && (
            <Button onClick={() => setShowEditForm(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Cliente
            </Button>
          )}
          {canDeleteClient() && (
            <Button 
              variant="danger" 
              onClick={() => handleDeleteClient(client.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Cliente
            </Button>
          )}
          <Button onClick={() => setShowProposalForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Proposta
          </Button>
          <Button onClick={() => setShowActivityForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Atividade
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'proposals', label: `Propostas (${proposals.length})` },
            { id: 'activities', label: `Atividades (${activities.length})` },
            { id: 'timeline', label: 'Linha do Tempo' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Informações de Contato</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">E-mail</p>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1 text-gray-400" />
                      <a href={`mailto:${client.email}`} className="text-blue-600 hover:text-blue-800 font-medium">
                        {client.email}
                      </a>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1 text-gray-400" />
                      <a href={`tel:${client.phone}`} className="text-blue-600 hover:text-blue-800 font-medium">
                        {client.phone}
                      </a>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Endereço</p>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {client.address.street}, {client.address.number}
                          {client.address.complement && `, ${client.address.complement}`}
                        </p>
                        <p className="text-gray-600">
                          {client.address.neighborhood}, {client.address.city} - {client.address.state}
                        </p>
                        <p className="text-gray-600">CEP: {client.address.zipCode}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Funnel Stage Management */}
            <FunnelStageSelector clientId={clientId} currentStage={client.funnelStage} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Estatísticas</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Propostas ativas</span>
                    <span className="font-medium">
                      {proposals.filter(p => p.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Valor total em propostas</span>
                    <span className="font-medium">
                      R$ {totalProposalValue.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tempo total investido</span>
                    <span className="font-medium">{client.totalTimeSpent.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Atividades registradas</span>
                    <span className="font-medium">{activities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Cliente desde</span>
                    <span className="font-medium">
                      {client.createdAt.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Atividade Recente</h2>
              </CardHeader>
              <CardContent>
                {activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities
                      .sort((a, b) => b.date.getTime() - a.date.getTime())
                      .slice(0, 3)
                      .map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <span className="text-lg">{getActivityTypeIcon(activity.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {format(activity.date, 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">
                              {activity.timeSpent}h
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {activities.length > 3 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        +{activities.length - 3} atividades adicionais
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhuma atividade registrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'proposals' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Propostas Comerciais</h2>
              <Button onClick={() => setShowProposalForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Proposta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {proposals.length > 0 ? (
              <div className="space-y-4">
                {proposals
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                  .map((proposal) => (
                  <div key={proposal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{proposal.description}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getProposalStatusColor(proposal.status)}`}>
                            {getProposalStatusLabel(proposal.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>R$ {proposal.value.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(proposal.createdAt, 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                        </div>
                        
                        {proposal.notes && (
                          <div className="mt-3 bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{proposal.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Nenhuma proposta registrada ainda.</p>
                <Button onClick={() => setShowProposalForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira proposta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'activities' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Atividades Comerciais</h2>
              <Button onClick={() => setShowActivityForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Atividade
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map((activity) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <span className="text-2xl">{getActivityTypeIcon(activity.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{activity.description}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{activity.timeSpent}h</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <span>{getActivityTypeLabel(activity.type)}</span>
                          <span>•</span>
                          <span>{format(activity.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                          <span>•</span>
                          <span>Por: {getUserName(activity.createdBy)}</span>
                        </div>
                        
                        {activity.notes && (
                          <div className="bg-gray-50 rounded-lg p-3 mt-3">
                            <p className="text-sm text-gray-700">{activity.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Nenhuma atividade registrada ainda.</p>
                <Button onClick={() => setShowActivityForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar primeira atividade
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'timeline' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Linha do Tempo</h2>
          </CardHeader>
          <CardContent>
            {(activities.length > 0 || proposals.length > 0) ? (
              <div className="space-y-4">
                {/* Combine and sort activities and proposals by date */}
                {[
                  ...activities.map(a => ({ ...a, type: 'activity', date: a.date })),
                  ...proposals.map(p => ({ ...p, type: 'proposal', date: p.createdAt }))
                ]
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map((item, index) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        item.type === 'activity' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      {index < activities.length + proposals.length - 1 && (
                        <div className="w-px h-8 bg-gray-300 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {item.type === 'activity' 
                            ? (item as any).description 
                            : `Proposta: ${(item as any).description}`
                          }
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.type === 'activity' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {item.type === 'activity' ? 'Atividade' : 'Proposta'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {format(item.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        {item.type === 'activity' && (
                          <span className="ml-2">• {(item as any).timeSpent}h</span>
                        )}
                        {item.type === 'proposal' && (
                          <span className="ml-2">• R$ {(item as any).value.toLocaleString('pt-BR')}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma atividade ou proposta registrada ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}