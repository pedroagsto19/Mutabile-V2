import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { useSupplier } from '../../context/SupplierContext';
import { useProject } from '../../context/ProjectContext';
import type { Supplier } from '../../types/supplier';
import { useNotification } from '../../context/NotificationContext';

interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

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

export function SupplierForm({ isOpen, onClose, supplier }: SupplierFormProps) {
  const { addSupplier, updateSupplier } = useSupplier();
  const { projects } = useProject();
  const { toast } = useNotification();
  
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    location: {
      city: '',
      state: '',
      country: 'Brasil'
    },
    website: '',
    mainContact: '',
    description: '',
    observations: '',
    ratings: {
      quality: 5,
      price: 5,
      recommendation: 5
    },
    linkedProjects: [] as string[]
  });

  const [countryType, setCountryType] = useState<'brasil' | 'outros'>('brasil');

  // Filter active projects only and update when projects change
  const activeProjects = React.useMemo(() => {
    return projects.filter(p => 
      p.status === 'in_progress' || 
      p.status === 'planning' || 
      p.status === 'on_hold'
    );
  }, [projects]);
  // Update form data when supplier changes
  useEffect(() => {
    if (supplier) {
      const isBrazil = supplier.location.country === 'Brasil';
      setCountryType(isBrazil ? 'brasil' : 'outros');
      
      setFormData({
        name: supplier.name,
        cnpj: supplier.cnpj || '',
        location: {
          city: supplier.location.city || '',
          state: supplier.location.state || '',
          country: supplier.location.country || 'Brasil'
        },
        website: supplier.website || '',
        mainContact: supplier.mainContact || '',
        description: supplier.description || '',
        observations: supplier.observations || '',
        ratings: {
          quality: supplier.ratings.quality,
          price: supplier.ratings.price,
          recommendation: (supplier.ratings as any).recommendation || 5
        },
        linkedProjects: supplier.linkedProjects
      });
    } else {
      // Reset form for new supplier
      setCountryType('brasil');
      setFormData({
        name: '',
        cnpj: '',
        location: {
          city: '',
          state: '',
          country: 'Brasil'
        },
        website: '',
        mainContact: '',
        description: '',
        observations: '',
        ratings: {
          quality: 5,
          price: 5,
          recommendation: 5
        },
        linkedProjects: []
      });
    }
  }, [supplier, isOpen]);

  const normalizeUrl = (url: string) => {
    if (!url) return '';
    
    // Remove espaços em branco
    url = url.trim();
    
    // Se não começar com http:// ou https://, adicionar https://
    if (!url.match(/^https?:\/\//)) {
      url = 'https://' + url;
    }
    
    return url;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supplierData = {
        ...formData,
        website: normalizeUrl(formData.website)
      };

      if (supplier) {
        updateSupplier(supplier.id, supplierData);
        toast.success('Fornecedor atualizado com sucesso!');
      } else {
        addSupplier(supplierData);
        toast.success('Fornecedor cadastrado com sucesso!');
      }
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar fornecedor', 'Tente novamente mais tarde.');
    }
  };

  const handleCountryTypeChange = (type: 'brasil' | 'outros') => {
    setCountryType(type);
    if (type === 'brasil') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          country: 'Brasil',
          state: ''
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          country: '',
          state: ''
        }
      }));
    }
  };

  const renderStarRating = (rating: number, onChange: (rating: number) => void, emoji: string) => {
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="focus:outline-none text-2xl"
          >
            <span className={i < rating ? 'opacity-100' : 'opacity-30'}>
              {emoji}
            </span>
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const toggleProject = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      linkedProjects: prev.linkedProjects.includes(projectId)
        ? prev.linkedProjects.filter(id => id !== projectId)
        : [...prev.linkedProjects, projectId]
    }));
  };


  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Fornecedor *
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
              CPF/CNPJ *
            </label>
            <input
              type="text"
              required
              value={formData.cnpj}
              onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
          </div>
        </div>

        {/* Country Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            País *
          </label>
          <select
            value={countryType}
            onChange={(e) => handleCountryTypeChange(e.target.value as 'brasil' | 'outros')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
          >
            <option value="brasil">Brasil</option>
            <option value="outros">Outros</option>
          </select>
        </div>

        {/* Location Fields */}
        {countryType === 'brasil' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade *
              </label>
              <input
                type="text"
                required
                value={formData.location.city}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, city: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado *
              </label>
              <select
                required
                value={formData.location.state}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, state: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              >
                <option value="">Selecione o estado</option>
                {brazilianStates.map(state => (
                  <option key={state.code} value={state.code}>
                    {state.code} - {state.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                País *
              </label>
              <input
                type="text"
                required
                value={formData.location.country}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, country: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado *
              </label>
              <input
                type="text"
                required
                value={formData.location.state}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, state: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade *
              </label>
              <input
                type="text"
                required
                value={formData.location.city}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, city: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contato Principal
            </label>
            <input
              type="text"
              value={formData.mainContact}
              onChange={(e) => setFormData(prev => ({ ...prev, mainContact: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              placeholder="Nome, telefone ou e-mail"
            />
          </div>
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
            placeholder="Serviços/produtos oferecidos"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={formData.observations}
            onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none resize-none"
            placeholder="Importante saber"
          />
        </div>

        {/* Ratings */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Avaliação - Qualidade
            </label>
            {renderStarRating(formData.ratings.quality, (rating) => 
              setFormData(prev => ({ 
                ...prev, 
                ratings: { ...prev.ratings, quality: rating }
              }))
            , '👍')}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Avaliação - Preço
            </label>
            {renderStarRating(formData.ratings.price, (rating) => 
              setFormData(prev => ({ 
                ...prev, 
                ratings: { ...prev.ratings, price: rating }
              }))
            , '💰')}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Avaliação - Indicabilidade
            </label>
            {renderStarRating(formData.ratings.recommendation, (rating) => 
              setFormData(prev => ({ 
                ...prev, 
                ratings: { ...prev.ratings, recommendation: rating }
              }))
            , '⭐')}
          </div>
        </div>

        {/* Project Linking */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Projetos Vinculados
          </label>
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {activeProjects.length > 0 ? (
              <div className="space-y-2">
                {activeProjects.map(project => (
                  <label key={project.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.linkedProjects.includes(project.id)}
                      onChange={() => toggleProject(project.id)}
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {project.name}
                      <span className="text-gray-500 ml-1">({project.client})</span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum projeto ativo disponível</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {supplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}