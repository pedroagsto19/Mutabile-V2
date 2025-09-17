import React, { useState } from 'react';
import { Plus, Search, Filter, MapPin, Mail, Phone, Edit, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { ClientForm } from './ClientForm';
import { FunnelOverview } from './FunnelOverview';
import { useClient } from '../../context/ClientContext';
import type { ClientFilters } from '../../types/client';
import { useNotification } from '../../context/NotificationContext';

const brazilianStates = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
];

interface ClientListProps {
  onClientSelect: (clientId: string) => void;
}

export function ClientList({ onClientSelect }: ClientListProps) {
  const { 
    clients, 
    deleteClient, 
    canDeleteClient, 
    canEditClient,
    getFunnelStats 
  } = useClient();
  const { toast, confirm } = useNotification();
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [filters, setFilters] = useState<ClientFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const funnelStats = getFunnelStats();

  const filteredClients = clients.filter(client => {
    if (filters.search && !client.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !client.email.toLowerCase().includes(filters.search.toLowerCase()) &&
        !client.document.includes(filters.search)) {
      return false;
    }
    if (filters.funnelStage && client.funnelStage !== filters.funnelStage) return false;
    if (filters.documentType && client.documentType !== filters.documentType) return false;
    if (filters.state && client.address.state !== filters.state) return false;
    if (filters.city && client.address.city !== filters.city) return false;
    return true;
  });

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

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setShowClientForm(true);
  };

  const handleDeleteClient = (clientId: string) => {
    confirm({
      title: 'Excluir Cliente',
      message: 'Tem certeza que deseja excluir este cliente? Esta ação também removerá todas as propostas e atividades relacionadas e não pode ser desfeita.',
      type: 'danger',
      confirmText: 'Excluir Cliente',
      cancelText: 'Cancelar'
    }).then((confirmed) => {
      if (confirmed) {
        try {
          deleteClient(clientId);
          toast.success('Cliente excluído com sucesso!');
        } catch (error: any) {
          toast.error('Erro ao excluir cliente', error.message || 'Tente novamente mais tarde.');
        }
      }
    });
  };

  const handleFormClose = () => {
    setShowClientForm(false);
    setEditingClient(null);
  };

  // Get unique values for filters
  const uniqueStates = [...new Set(clients.map(c => c.address.state).filter(Boolean))];
  const uniqueCities = [...new Set(clients.map(c => c.address.city).filter(Boolean))];

  return (
    <div className="space-y-6">
      <ClientForm
        isOpen={showClientForm}
        onClose={handleFormClose}
        client={editingClient}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Gestão de Clientes
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredClients.length} clientes encontrados
          </p>
        </div>
        <Button onClick={() => setShowClientForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Funnel Overview */}
      <FunnelOverview stats={funnelStats} />

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
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
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <select
                value={filters.funnelStage || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, funnelStage: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              >
                <option value="">Todas as etapas</option>
                <option value="prospecting">Prospecção</option>
                <option value="proposal_sent">Proposta Enviada</option>
                <option value="negotiation">Negociação</option>
                <option value="closed">Fechado</option>
                <option value="lost">Perdido</option>
              </select>
              
              <select
                value={filters.documentType || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              >
                <option value="">CPF e CNPJ</option>
                <option value="cpf">Apenas CPF</option>
                <option value="cnpj">Apenas CNPJ</option>
              </select>
              
              <select
                value={filters.state || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              >
                <option value="">Todos os estados</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              
              <select
                value={filters.city || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              >
                <option value="">Todas as cidades</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Etapa do Funil
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tempo Investido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr 
                  key={client.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onClientSelect(client.id)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">
                        {client.documentType.toUpperCase()}: {client.document}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                        {client.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="h-3 w-3 mr-1 text-gray-400" />
                        {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      <div>
                        <div>{client.address.city}</div>
                        <div className="text-gray-500">{client.address.state}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFunnelStageColor(client.funnelStage)}`}>
                      {getFunnelStageLabel(client.funnelStage)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <TrendingUp className="h-4 w-4 mr-1 text-gray-400" />
                      {client.totalTimeSpent.toFixed(1)}h
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      {canEditClient() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClient(client)}
                          title="Editar cliente"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteClient() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClient(client.id)}
                          title="Excluir cliente"
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

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Nenhum cliente encontrado.</p>
          <Button onClick={() => setShowClientForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar primeiro cliente
          </Button>
        </div>
      )}
    </div>
  );
}