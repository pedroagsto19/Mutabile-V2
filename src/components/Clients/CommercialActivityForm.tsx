import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { useClient } from '../../context/ClientContext';
import { useNotification } from '../../context/NotificationContext';

interface CommercialActivityFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export function CommercialActivityForm({ isOpen, onClose, clientId }: CommercialActivityFormProps) {
  const { addCommercialActivity } = useClient();
  const { toast } = useNotification();
  
  const [formData, setFormData] = useState({
    type: 'meeting' as const,
    description: '',
    timeSpent: '',
    date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const activityData = {
        clientId,
        type: formData.type,
        description: formData.description,
        timeSpent: parseFloat(formData.timeSpent),
        date: new Date(formData.date),
        notes: formData.notes || undefined
      };

      addCommercialActivity(activityData);
      toast.success('Atividade registrada com sucesso!');
      
      // Reset form
      setFormData({
        type: 'meeting',
        description: '',
        timeSpent: '',
        date: new Date().toISOString().slice(0, 16),
        notes: ''
      });
      
      onClose();
    } catch (error) {
      toast.error('Erro ao registrar atividade', 'Tente novamente mais tarde.');
    }
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Nova Atividade Comercial"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Atividade *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            >
              <option value="meeting">🤝 Reunião</option>
              <option value="call">📞 Ligação</option>
              <option value="email">📧 E-mail</option>
              <option value="visit">🏠 Visita</option>
              <option value="other">📝 Outro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tempo Gasto (horas) *
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              required
              value={formData.timeSpent}
              onChange={(e) => setFormData(prev => ({ ...prev, timeSpent: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              placeholder="Ex: 1.5"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição da Atividade *
          </label>
          <input
            type="text"
            required
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            placeholder="Ex: Reunião inicial para apresentação da empresa"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data e Hora *
          </label>
          <input
            type="datetime-local"
            required
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
          />
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
            placeholder="Detalhes sobre a atividade, resultados, próximos passos..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            Registrar Atividade
          </Button>
        </div>
      </form>
    </Modal>
  );
}