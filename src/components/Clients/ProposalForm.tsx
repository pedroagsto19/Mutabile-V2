import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { useClient } from '../../context/ClientContext';
import { useNotification } from '../../context/NotificationContext';

interface ProposalFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export function ProposalForm({ isOpen, onClose, clientId }: ProposalFormProps) {
  const { addProposal } = useClient();
  const { toast } = useNotification();
  
  const [formData, setFormData] = useState({
    description: '',
    value: '',
    status: 'active' as const,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const proposalData = {
        clientId,
        description: formData.description,
        value: parseFloat(formData.value.replace(/[^\d,]/g, '').replace(',', '.')),
        status: formData.status,
        notes: formData.notes || undefined
      };

      addProposal(proposalData);
      toast.success('Proposta criada com sucesso!');
      
      // Reset form
      setFormData({
        description: '',
        value: '',
        status: 'active',
        notes: ''
      });
      
      onClose();
    } catch (error) {
      toast.error('Erro ao criar proposta', 'Tente novamente mais tarde.');
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = (parseInt(numericValue) / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formattedValue === 'NaN' ? '' : `R$ ${formattedValue}`;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Nova Proposta Comercial"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição da Proposta *
          </label>
          <input
            type="text"
            required
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            placeholder="Ex: Projeto arquitetônico residencial - Casa 300m²"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor da Proposta *
            </label>
            <input
              type="text"
              required
              value={formData.value}
              onChange={(e) => {
                const formatted = formatCurrency(e.target.value);
                setFormData(prev => ({ ...prev, value: formatted }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              placeholder="R$ 0,00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status da Proposta *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            >
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
              <option value="rejected">Recusado</option>
              <option value="accepted">Aceito</option>
            </select>
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
            placeholder="Detalhes adicionais sobre a proposta..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            Criar Proposta
          </Button>
        </div>
      </form>
    </Modal>
  );
}