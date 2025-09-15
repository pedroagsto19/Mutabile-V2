import React from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { Button } from '../UI/Button';
import { useClient } from '../../context/ClientContext';
import { useNotification } from '../../context/NotificationContext';

interface FunnelStageSelectorProps {
  clientId: string;
  currentStage: string;
}

export function FunnelStageSelector({ clientId, currentStage }: FunnelStageSelectorProps) {
  const { updateClient, canEditClient } = useClient();
  const { toast, confirm } = useNotification();

  const stages = [
    { id: 'prospecting', label: 'Prospecção', description: 'Cliente em fase de prospecção inicial' },
    { id: 'proposal_sent', label: 'Proposta Enviada', description: 'Proposta comercial enviada ao cliente' },
    { id: 'negotiation', label: 'Negociação', description: 'Em processo de negociação de valores/condições' },
    { id: 'closed', label: 'Fechado', description: 'Negócio fechado com sucesso' },
    { id: 'lost', label: 'Perdido', description: 'Cliente perdido ou desistiu do projeto' }
  ];

  const currentStageIndex = stages.findIndex(s => s.id === currentStage);

  const handleStageChange = async (newStage: string) => {
    if (!canEditClient()) {
      toast.warning('Sem permissão', 'Você não tem permissão para alterar a etapa do funil');
      return;
    }

    const newStageIndex = stages.findIndex(s => s.id === newStage);
    const newStageLabel = stages[newStageIndex]?.label;
    
    const confirmed = await confirm({
      title: 'Alterar Etapa do Funil',
      message: `Tem certeza que deseja mover este cliente para "${newStageLabel}"?`,
      type: newStage === 'lost' ? 'warning' : 'info',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      try {
        updateClient(clientId, { funnelStage: newStage as any });
        toast.success(`Cliente movido para "${newStageLabel}" com sucesso!`);
      } catch (error) {
        toast.error('Erro ao atualizar etapa', 'Tente novamente mais tarde.');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Etapa do Funil de Vendas</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const isActive = stage.id === currentStage;
            const isPast = index < currentStageIndex;
            const isFuture = index > currentStageIndex;
            
            return (
              <div key={stage.id} className="relative">
                <div
                  className={`flex items-center p-4 rounded-lg border-2 transition-all ${
                    isActive 
                      ? 'border-black bg-black text-white' 
                      : isPast
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  } ${canEditClient() && !isActive ? 'cursor-pointer' : ''}`}
                  onClick={() => canEditClient() && !isActive && handleStageChange(stage.id)}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isActive 
                        ? 'bg-white text-black' 
                        : isPast
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isPast ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        isActive ? 'text-white' : isPast ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        {stage.label}
                      </h3>
                      <p className={`text-sm ${
                        isActive ? 'text-gray-200' : isPast ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {stage.description}
                      </p>
                    </div>
                  </div>
                  
                  {canEditClient() && !isActive && (
                    <ChevronRight className={`h-5 w-5 ${
                      isPast ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  )}
                  
                  {isActive && (
                    <div className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs font-medium">
                      Atual
                    </div>
                  )}
                </div>
                
                {/* Connection line */}
                {index < stages.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className={`w-px h-4 ${
                      index < currentStageIndex ? 'bg-green-300' : 'bg-gray-300'
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {!canEditClient() && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Você não tem permissão para alterar a etapa do funil. Entre em contato com um administrador.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}