import React, { useState } from 'react';
import { Plus, Search, Filter, Star, MapPin, Globe, Trash2, Edit } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { SupplierForm } from './SupplierForm';
import { useSupplier } from '../../context/SupplierContext';
import { useProject } from '../../context/ProjectContext';
import type { SupplierFilters } from '../../types/supplier';

interface SupplierListProps {
  onSupplierSelect: (supplierId: string) => void;
}

export function SupplierList({ onSupplierSelect }: SupplierListProps) {
  const { suppliers, getSuppliersByRanking, deleteSupplier, canDeleteSupplier, canEditSupplier } = useSupplier();
  const { projects } = useProject();
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [filters, setFilters] = useState<SupplierFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const rankedSuppliers = getSuppliersByRanking();

  const filteredSuppliers = rankedSuppliers.filter(supplier => {
    if (filters.search && !supplier.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.country && supplier.location.country !== filters.country) return false;
    if (filters.state && supplier.location.state !== filters.state) return false;
    if (filters.city && supplier.location.city !== filters.city) return false;
    return true;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getAverageRating = (supplier: any) => {
    return (supplier.ratings.quality + supplier.ratings.price) / 2;
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
    if (confirm('Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.')) {
      deleteSupplier(supplierId);
    }
  };

  const handleFormClose = () => {
    setShowSupplierForm(false);
    setEditingSupplier(null);
  };

  // Get unique locations for filters
  const uniqueCountries = [...new Set(suppliers.map(s => s.location.country).filter(Boolean))];
  const uniqueStates = [...new Set(suppliers.map(s => s.location.state).filter(Boolean))];
  const uniqueCities = [...new Set(suppliers.map(s => s.location.city).filter(Boolean))];

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
            <div className="mt-4 grid grid-cols-3 gap-4">
              <select
                value={filters.country || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              >
                <option value="">Todos os países</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
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
                  Média
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
              {filteredSuppliers.map((supplier, index) => {
                const avgRating = getAverageRating(supplier);
                const linkedProjects = getLinkedProjectNames(supplier.linkedProjects);
                
                return (
                  <tr 
                    key={supplier.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onSupplierSelect(supplier.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-gray-900">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        {supplier.cnpj && (
                          <div className="text-sm text-gray-500">CNPJ: {supplier.cnpj}</div>
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
                      <div className="flex items-center">
                        {renderStars(supplier.ratings.quality)}
                        <span className="ml-2 text-sm text-gray-600">({supplier.ratings.quality})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {renderStars(supplier.ratings.price)}
                        <span className="ml-2 text-sm text-gray-600">({supplier.ratings.price})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {renderStars(Math.round(avgRating))}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {avgRating.toFixed(1)}
                        </span>
                      </div>
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