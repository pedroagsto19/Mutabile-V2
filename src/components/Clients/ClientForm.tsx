import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { useClient } from '../../context/ClientContext';
import type { Client } from '../../types/client';
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

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
}

export function ClientForm({ isOpen, onClose, client }: ClientFormProps) {
  const { addClient, updateClient } = useClient();
  const { toast } = useNotification();
  
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    documentType: 'cpf' as const,
    email: '',
    phone: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    },
    funnelStage: 'prospecting' as const
  });

  // Update form data when client changes
  useEffect(() => {
    if (client) {
      // Auto-detect document type for existing client
      const cleanDoc = client.document.replace(/\D/g, '');
      const detectedType = cleanDoc.length === 14 ? 'cnpj' : 'cpf';
      
      setFormData({
        name: client.name,
        document: client.document,
        documentType: detectedType,
        email: client.email,
        phone: client.phone,
        address: {
          street: client.address.street,
          number: client.address.number,
          complement: client.address.complement || '',
          neighborhood: client.address.neighborhood,
          city: client.address.city,
          state: client.address.state,
          zipCode: client.address.zipCode
        },
        funnelStage: client.funnelStage
      });
    } else {
      // Reset form for new client
      setFormData({
        name: '',
        document: '',
        documentType: 'cpf',
        email: '',
        phone: '',
        address: {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: ''
        },
        funnelStage: 'prospecting'
      });
    }
  }, [client, isOpen]);

  const validateDocument = (document: string, type: 'cpf' | 'cnpj'): boolean => {
    const cleanDoc = document.replace(/\D/g, '');
    
    if (type === 'cpf') {
      return cleanDoc.length === 11 && /^\d{11}$/.test(cleanDoc);
    } else {
      return cleanDoc.length === 14 && /^\d{14}$/.test(cleanDoc);
    }
  };

  const formatDocument = (document: string, type: 'cpf' | 'cnpj'): string => {
    const cleanDoc = document.replace(/\D/g, '');
    
    if (type === 'cpf') {
      if (cleanDoc.length === 11) {
        return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
    } else {
      if (cleanDoc.length === 14) {
        return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
    }
    return document; // Return as-is if not complete
  };

  const formatPhone = (phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  };

  const formatZipCode = (zipCode: string): string => {
    const cleanZip = zipCode.replace(/\D/g, '');
    return cleanZip.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-detect document type based on clean length
    const cleanDoc = formData.document.replace(/\D/g, '');
    let finalDocumentType: 'cpf' | 'cnpj' = 'cpf';
    
    if (cleanDoc.length === 14) {
      finalDocumentType = 'cnpj';
    } else if (cleanDoc.length === 11) {
      finalDocumentType = 'cpf';
    }
    
    // Validate document
    if (!validateDocument(formData.document, finalDocumentType)) {
      toast.error('Documento inválido', `${finalDocumentType.toUpperCase()} deve ter o formato correto (${finalDocumentType === 'cpf' ? '11 dígitos' : '14 dígitos'})`);
      return;
    }

    try {
      const clientData = {
        ...formData,
        documentType: finalDocumentType,
        document: formatDocument(formData.document, finalDocumentType),
        phone: formatPhone(formData.phone),
        address: {
          ...formData.address,
          zipCode: formatZipCode(formData.address.zipCode)
        }
      };

      if (client) {
        updateClient(client.id, clientData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        addClient(clientData);
        toast.success('Cliente cadastrado com sucesso!');
      }
      onClose();
    } catch (error: any) {
      toast.error('Erro ao salvar cliente', error.message || 'Tente novamente mais tarde.');
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={client ? 'Editar Cliente' : 'Novo Cliente'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo / Razão Social *
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
              Tipo Detectado
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
              {formData.documentType === 'cpf' ? 'CPF (Pessoa Física)' : 'CNPJ (Pessoa Jurídica)'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tipo detectado automaticamente baseado no número de dígitos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF/CNPJ *
            </label>
            <input
              type="text"
              required
              value={formData.document}
              onChange={(e) => {
                const value = e.target.value;
                const cleanValue = value.replace(/\D/g, '');
                
                // Auto-detect document type based on length
                let detectedType: 'cpf' | 'cnpj' = 'cpf';
                if (cleanValue.length > 11) {
                  detectedType = 'cnpj';
                }
                
                setFormData(prev => ({ 
                  ...prev, 
                  document: value,
                  documentType: detectedType
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Digite CPF (11 dígitos) ou CNPJ (14 dígitos). O tipo será detectado automaticamente.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              placeholder="(00) 00000-0000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Etapa do Funil *
            </label>
            <select
              value={formData.funnelStage}
              onChange={(e) => setFormData(prev => ({ ...prev, funnelStage: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            >
              <option value="prospecting">Prospecção</option>
              <option value="proposal_sent">Proposta Enviada</option>
              <option value="negotiation">Negociação</option>
              <option value="closed">Fechado</option>
              <option value="lost">Perdido</option>
            </select>
          </div>
        </div>

        {/* Address Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logradouro *
              </label>
              <input
                type="text"
                required
                value={formData.address.street}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, street: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número *
              </label>
              <input
                type="text"
                required
                value={formData.address.number}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, number: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complemento
              </label>
              <input
                type="text"
                value={formData.address.complement}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, complement: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                placeholder="Apto, sala, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bairro *
              </label>
              <input
                type="text"
                required
                value={formData.address.neighborhood}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, neighborhood: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
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
                value={formData.address.city}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, city: e.target.value }
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
                value={formData.address.state}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, state: e.target.value }
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CEP *
              </label>
              <input
                type="text"
                required
                value={formData.address.zipCode}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, zipCode: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                placeholder="00000-000"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {client ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}