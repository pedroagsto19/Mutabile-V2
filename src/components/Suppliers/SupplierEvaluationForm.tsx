import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { useSupplier } from '../../context/SupplierContext';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface SupplierEvaluationFormProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
}

export function SupplierEvaluationForm({ isOpen, onClose, supplierId }: SupplierEvaluationFormProps) {
  const { addEvaluation } = useSupplier();
  const { projects } = useProject();
  const { user: currentUser } = useAuth();
  const { toast } = useNotification();
  
  const [formData, setFormData] = useState({
    projectId: '',
    evaluationDate: new Date().toISOString().split('T')[0],
    ratings: {
      quality: 5,
      price: 5,
      recommendation: 5
    },
    notes: ''
  });

  // Filter projects that are linked to this supplier or all projects
  const availableProjects = projects.filter(p => 
    p.status === 'in_progress' || 
    p.status === 'completed' || 
    p.status === 'on_hold'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Erro', 'Usuário não autenticado');
      return;
    }
    
    try {
      const evaluationData = {
        projectId: formData.projectId || undefined,
        projectName: formData.projectId ? projects.find(p => p.id === formData.projectId)?.name : undefined,
        evaluationDate: new Date(formData.evaluationDate + 'T12:00:00'),
        ratings: formData.ratings,
        notes: formData.notes || undefined
      };

      addEvaluation(supplierId, evaluationData);
      toast.success('Avaliação adicionada com sucesso!');
      
      // Reset form
      setFormData({
        projectId: '',
        evaluationDate: new Date().toISOString().split('T')[0],
        ratings: {
          quality: 5,
          price: 5,
          recommendation: 5
        },
        notes: ''
      });
      
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar avaliação', 'Tente novamente mais tarde.');
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
            className="focus:outline-none text-2xl hover:scale-110 transition-transform"
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Nova Avaliação do Fornecedor"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da Avaliação *
            </label>
            <input
              type="date"
              required
              value={formData.evaluationDate}
              onChange={(e) => setFormData(prev => ({ ...prev, evaluationDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projeto (Opcional)
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            >
              <option value="">Avaliação geral</option>
              {availableProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.client})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ratings */}
        <div className="space-y-6">
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
              Avaliação - Índice de Indicação
            </label>
            {renderStarRating(formData.ratings.recommendation, (rating) => 
              setFormData(prev => ({ 
                ...prev, 
                ratings: { ...prev.ratings, recommendation: rating }
              }))
            , '⭐')}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none resize-none"
            placeholder="Comentários sobre esta avaliação..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            Salvar Avaliação
          </Button>
        </div>
      </form>
    </Modal>
  );
}