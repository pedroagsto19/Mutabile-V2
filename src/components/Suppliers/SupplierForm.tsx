import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { Star } from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { useProject } from '../../context/ProjectContext';
import type { Supplier } from '../../types/supplier';
import { useNotification } from '../../context/NotificationContext';

interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

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
      country: ''
    },
    website: '',
    mainContact: '',
    description: '',
    ratings: {
      quality: 5,
      price: 5
    },
    linkedProjects: [] as string[]
  });

  // Update form data when supplier changes
  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        cnpj: supplier.cnpj || '',
        location: {
          city: supplier.location.city || '',
          state: supplier.location.state || '',
          country: supplier.location.country || ''
        },
        website: supplier.website || '',
        mainContact: supplier.mainContact || '',
        description: supplier.description || '',
        ratings: supplier.ratings,
        linkedProjects: supplier.linkedProjects
      });
    } else {
      // Reset form for new supplier
      setFormData({
        name: '',
        cnpj: '',
        location: {
          city: '',
          state: '',
          country: ''
        },
        website: '',
        mainContact: '',
        description: '',
        ratings: {
          quality: 5,
          price: 5
        },
        linkedProjects: []
      });
    }
  }, [supplier, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (supplier) {
        updateSupplier(supplier.id, formData);
        toast.success('Fornecedor atualizado com sucesso!');
      } else {
        addSupplier(formData);
        toast.success('Fornecedor cadastrado com sucesso!');
      }
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar fornecedor', 'Tente novamente mais tarde.');
    }
  };

  const renderStarRating = (rating: number, onChange: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 ${
                i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              } hover:text-yellow-400 transition-colors`}
            />
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

  // Filter active projects only
  const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'planning');

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
              CNPJ *
            </label>
            <input
              type="text"
              required
              value={formData.cnpj}
              onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              placeholder="00.000.000/0000-00"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              placeholder="https://exemplo.com"
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
            placeholder="Descreva os serviços ou produtos oferecidos..."
          />
        </div>

        {/* Ratings */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Avaliação - Qualidade
            </label>
            {renderStarRating(formData.ratings.quality, (rating) => 
              setFormData(prev => ({ 
                ...prev, 
                ratings: { ...prev.ratings, quality: rating }
              }))
            )}
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
            )}
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