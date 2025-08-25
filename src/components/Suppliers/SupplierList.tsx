import React, { useState } from 'react';
import { Plus, Search, Filter, MapPin, Globe, Trash2, Edit } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { SupplierForm } from './SupplierForm';
import { useSupplier } from '../../context/SupplierContext';
import { useProject } from '../../context/ProjectContext';
import type { SupplierFilters } from '../../types/supplier';
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

interface SupplierListProps {
  onSupplierSelect: (supplierId: string) => void;
}

export function SupplierList({ onSupplierSelect }: SupplierListProps) {
  const { suppliers, getSuppliersByRanking, deleteSupplier, canDeleteSupplier, canEditSupplier } = useSupplier();
  const { projects } = useProject();
  const { toast, confirm } = useNotification();
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [filters, setFilters] = useState<SupplierFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [countryFilter, setCountryFilter] = useState<'brasil' | 'outros' | ''>('');

  const rankedSuppliers = getSuppliersByRanking();

  const filteredSuppliers = rankedSuppliers.filter(supplier => {
    if (filters.search && !supplier.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (countryFilter === 'brasil' && supplier.location.country !== 'Brasil') return false;
    if (countryFilter === 'outros' && supplier.location.country === 'Brasil') return false;
    if (filters.country && supplier.location.country !== filters.country) return false;
    if (filters.state && supplier.location.state !== filters.state) return false;
    if (filters.city && supplier.location.city !== filters.city) return false;
    return true;
  });

  const renderRating = (rating: number, emoji: string) => {
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`text-lg ${i < rating ? 'opacity-100' : 'opacity-30'}`}
          >
            {emoji}
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const getAverageRating = (supplier: any) => {
    const total = supplier.ratings.quality + supplier.ratings.price + supplier.ratings.recommendation;
    return total / 3;
  };

  const getLinkedProjectNames = (projectIds: string[]) => {
    return projectIds
      .map(id => projects.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setShowSupplierForm(true);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    confirm({
      title: 'Excluir Fornecedor',
      message: 'Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    }).then((confirmed) => {
      if (confirmed) {
        try {
          deleteSupplier(supplierId);
          toast.success('Fornecedor excluído com sucesso!');
        } catch (error) {
          toast.error('Erro ao excluir fornecedor', 'Tente novamente mais tarde.');
        }
      }
    });
  };

  const handleFormClose = () => {
    setShowSupplierForm(false);
    setEditingSupplier(null);
  };

  // Get unique locations for filters
  const uniqueCountries = [...new Set(suppliers.map(s => s.location.country).filter(Boolean))];
  const uniqueStates = [...new Set(suppliers.map(s => s.location.state).filter(Boolean))];
  const uniqueBrazilianStates = [...new Set(suppliers.filter(s => s.location.country === 'Brasil').map(s => s.location.state).filter(Boolean))];
  const uniqueCities = [...new Set(suppliers.map(s => s.location.city).filter(Boolean))];

  // Create ranking with tied positions
  const createRanking = (suppliers: any[]) => {
    const sortedSuppliers = [...suppliers].sort((a, b) => {
      const avgA = getAverageRating(a);
      const avgB = getAverageRating(b);
      return avgB - avgA;
    });

    const ranking: { supplier: any; rank: number }[] = [];
    let currentRank = 1;
    let previousAvg = null;
    let skipCount = 0;

    sortedSuppliers.forEach((supplier, index) => {
      const avg = getAverageRating(supplier);
      
      if (previousAvg !== null && avg < previousAvg) {
        currentRank += skipCount + 1;
        skipCount = 0;
      } else if (previousAvg !== null && avg === previousAvg) {
        skipCount++;
      }
      
      ranking.push({ supplier, rank: currentRank });
      previousAvg = avg;
    });

    return ranking;
  };

  const rankedSuppliersWithPosition = createRanking(filteredSuppliers);

  return (
    <div className="space-y-6">
      <SupplierForm
        isOpen={showSupplierForm}
        onClose={handleFormClose}
        supplier={editingSupplier}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Fornecedores
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredSuppliers.length} fornecedores encontrados • Ordenados por ranking
          </p>
        </div>
        <Button onClick={() => setShowSupplierForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar fornecedores..."
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
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País
                </label>
                <select
                  value={countryFilter}
                  onChange={(e) => {
                    setCountryFilter(e.target.value as any);
                    setFilters(prev => ({ ...prev, country: '', state: '', city: '' }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                >
                  <option value="">Todos os países</option>
                  <option value="brasil">Brasil</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
              
              {countryFilter === 'brasil' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={filters.state || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    >
                      <option value="">Todos os estados</option>
                      {brazilianStates.filter(state => uniqueBrazilianStates.includes(state.code)).map(state => (
                        <option key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <select
                      value={filters.city || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    >
                      <option value="">Todas as cidades</option>
                      {uniqueCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              {countryFilter === 'outros' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      País
                    </label>
                    <select
                      value={filters.country || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    >
                      <option value="">Todos os países</option>
                      {uniqueCountries.filter(country => country !== 'Brasil').map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={filters.state || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    >
                      <option value="">Todos os estados</option>
                      {uniqueStates.filter(state => !brazilianStates.some(bs => bs.code === state)).map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <select
                      value={filters.city || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    >
                      <option value="">Todas as cidades</option>
                      {uniqueCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ranking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fornecedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qualidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Indicabilidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projetos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rankedSuppliersWithPosition.map(({ supplier, rank }) => {
                const linkedProjects = getLinkedProjectNames(supplier.linkedProjects);
                
                return (
                  <tr 
                    key={supplier.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onSupplierSelect(supplier.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900">#{rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        {supplier.cnpj && (
                          <div className="text-sm text-gray-500">CPF/CNPJ: {supplier.cnpj}</div>
                        )}
                        {supplier.website && (
                          <div className="flex items-center text-sm text-blue-600 mt-1">
                            <Globe className="h-3 w-3 mr-1" />
                            {supplier.website}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        <div>
                          {supplier.location.city && <div>{supplier.location.city}</div>}
                          {supplier.location.state && <div className="text-gray-500">{supplier.location.state}</div>}
                          {supplier.location.country && <div className="text-gray-500">{supplier.location.country}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderRating(supplier.ratings.quality, '👍')}
                    </td>
                    <td className="px-6 py-4">
                      {renderRating(supplier.ratings.price, '💰')}
                    </td>
                    <td className="px-6 py-4">
                      {renderRating(supplier.ratings.recommendation || 5, '⭐')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {linkedProjects || 'Nenhum projeto'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                        {canEditSupplier() && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSupplier(supplier)}
                            title="Editar fornecedor"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteSupplier() && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            title="Excluir fornecedor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Nenhum fornecedor encontrado.</p>
          <Button onClick={() => setShowSupplierForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar primeiro fornecedor
          </Button>
        </div>
      )}
    </div>
  );
}