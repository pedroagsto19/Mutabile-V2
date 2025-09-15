import React from 'react';
import { TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../UI/Card';
import type { FunnelStats } from '../../types/client';

interface FunnelOverviewProps {
  stats: FunnelStats;
}

export function FunnelOverview({ stats }: FunnelOverviewProps) {
  const totalClients = stats.prospecting + stats.proposalSent + stats.negotiation + stats.closed + stats.lost;
  
  const funnelStages = [
    {
      name: 'Prospecção',
      count: stats.prospecting,
      color: 'bg-gray-500',
      percentage: totalClients > 0 ? (stats.prospecting / totalClients) * 100 : 0
    },
    {
      name: 'Proposta Enviada',
      count: stats.proposalSent,
      color: 'bg-blue-500',
      percentage: totalClients > 0 ? (stats.proposalSent / totalClients) * 100 : 0
    },
    {
      name: 'Negociação',
      count: stats.negotiation,
      color: 'bg-yellow-500',
      percentage: totalClients > 0 ? (stats.negotiation / totalClients) * 100 : 0
    },
    {
      name: 'Fechado',
      count: stats.closed,
      color: 'bg-green-500',
      percentage: totalClients > 0 ? (stats.closed / totalClients) * 100 : 0
    },
    {
      name: 'Perdido',
      count: stats.lost,
      color: 'bg-red-500',
      percentage: totalClients > 0 ? (stats.lost / totalClients) * 100 : 0
    }
  ];

  const conversionRate = totalClients > 0 ? (stats.closed / totalClients) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Funnel Visualization */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Funil de Vendas</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelStages.map((stage, index) => (
                <div key={stage.name} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{stage.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{stage.count} clientes</span>
                      <span className="text-xs text-gray-500">({stage.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  
                  <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${stage.color} transition-all duration-500 rounded-lg`}
                      style={{ width: `${Math.max(stage.percentage, 5)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {stage.count}
                      </span>
                    </div>
                  </div>
                  
                  {/* Conversion arrows */}
                  {index < funnelStages.length - 2 && (
                    <div className="flex justify-center mt-2">
                      <div className="text-gray-400">↓</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Summary */}
      <div className="space-y-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-green-600">{conversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Valor Total Fechado</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {stats.totalValue.toLocaleString('pt-BR')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tempo Médio p/ Fechar</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.averageTimeToClose.toFixed(1)}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}