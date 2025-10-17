import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Client, Proposal, CommercialActivity, ClientFilters, FunnelStats } from '../types/client';
import { useAuth } from './AuthContext';
import { clientOperations, proposalOperations, commercialActivityOperations } from '../lib/database';

interface ClientContextType {
  clients: Client[];
  proposals: Proposal[];
  commercialActivities: CommercialActivity[];
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'totalTimeSpent'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  updateProposal: (id: string, updates: Partial<Proposal>) => void;
  deleteProposal: (id: string) => void;
  addCommercialActivity: (activity: Omit<CommercialActivity, 'id' | 'createdAt' | 'createdBy'>) => void;
  updateCommercialActivity: (id: string, updates: Partial<CommercialActivity>) => void;
  deleteCommercialActivity: (id: string) => void;
  getClientProposals: (clientId: string) => Proposal[];
  getClientActivities: (clientId: string) => CommercialActivity[];
  getFunnelStats: () => FunnelStats;
  canEditClient: () => boolean;
  canDeleteClient: () => boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [commercialActivities, setCommercialActivities] = useState<CommercialActivity[]>([]);
  const { user: currentUser, hasPermission } = useAuth();

  // Load data from localStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load clients
    clientOperations.getAll()
      .then(setClients)
      .catch(console.error);
    
    // Load all proposals
    Promise.all(clients.map(client => proposalOperations.getByClientId(client.id)))
      .then(proposalArrays => {
        const allProposals = proposalArrays.flat();
        setProposals(allProposals);
      })
      .catch(console.error);
    
    // Load all commercial activities
    Promise.all(clients.map(client => commercialActivityOperations.getByClientId(client.id)))
      .then(activityArrays => {
        const allActivities = activityArrays.flat();
        setCommercialActivities(allActivities);
      })
      .catch(console.error);
  };

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'totalTimeSpent'>) => {
    if (!currentUser) return;
    
    clientOperations.create(clientData)
      .then(newClient => {
        setClients(prev => [...prev, newClient]);
      })
      .catch(error => {
        console.error('Error creating client:', error);
        throw error;
      });
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    if (!canEditClient()) {
      throw new Error('Sem permissão para editar clientes');
    }
    
    clientOperations.update(id, updates)
      .then(() => {
        loadData();
      })
      .catch(error => {
        console.error('Error updating client:', error);
        throw error;
      });
  };

  const deleteClient = (id: string) => {
    if (!canDeleteClient()) {
      throw new Error('Sem permissão para excluir clientes');
    }
    
    clientOperations.delete(id)
      .then(() => {
        setClients(prev => prev.filter(c => c.id !== id));
        setProposals(prev => prev.filter(p => p.clientId !== id));
        setCommercialActivities(prev => prev.filter(a => a.clientId !== id));
      })
      .catch(error => {
        console.error('Error deleting client:', error);
        throw error;
      });
  };

  const addProposal = (proposalData: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!currentUser) return;
    
    proposalOperations.create(proposalData)
      .then(newProposal => {
        setProposals(prev => [...prev, newProposal]);
      })
      .catch(error => {
        console.error('Error creating proposal:', error);
        throw error;
      });
  };

  const updateProposal = (id: string, updates: Partial<Proposal>) => {
    proposalOperations.update(id, updates)
      .then(() => {
        loadData();
      })
      .catch(error => {
        console.error('Error updating proposal:', error);
        throw error;
      });
  };

  const deleteProposal = (id: string) => {
    proposalOperations.delete(id)
      .then(() => {
        setProposals(prev => prev.filter(p => p.id !== id));
      })
      .catch(error => {
        console.error('Error deleting proposal:', error);
        throw error;
      });
  };

  const addCommercialActivity = (activityData: Omit<CommercialActivity, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!currentUser) return;
    
    commercialActivityOperations.create(activityData)
      .then(newActivity => {
        setCommercialActivities(prev => [...prev, newActivity]);
        loadData(); // Reload to get updated client total time
      })
      .catch(error => {
        console.error('Error creating commercial activity:', error);
        throw error;
      });
  };

  const updateCommercialActivity = (id: string, updates: Partial<CommercialActivity>) => {
    commercialActivityOperations.update(id, updates)
      .then(() => {
        loadData();
      })
      .catch(error => {
        console.error('Error updating commercial activity:', error);
        throw error;
      });
  };

  const deleteCommercialActivity = (id: string) => {
    commercialActivityOperations.delete(id)
      .then(() => {
        loadData();
      })
      .catch(error => {
        console.error('Error deleting commercial activity:', error);
        throw error;
      });
  };

  const getClientProposals = (clientId: string): Proposal[] => {
    return proposals.filter(p => p.clientId === clientId);
  };

  const getClientActivities = (clientId: string): CommercialActivity[] => {
    return commercialActivities.filter(a => a.clientId === clientId);
  };

  const getFunnelStats = (): FunnelStats => {
    const stats = {
      prospecting: clients.filter(c => c.funnelStage === 'prospecting').length,
      proposalSent: clients.filter(c => c.funnelStage === 'proposal_sent').length,
      negotiation: clients.filter(c => c.funnelStage === 'negotiation').length,
      closed: clients.filter(c => c.funnelStage === 'closed').length,
      lost: clients.filter(c => c.funnelStage === 'lost').length,
      totalValue: proposals
        .filter(p => p.status === 'accepted')
        .reduce((sum, p) => sum + p.value, 0),
      averageTimeToClose: 0
    };

    // Calculate average time to close
    const closedClients = clients.filter(c => c.funnelStage === 'closed');
    if (closedClients.length > 0) {
      const totalTime = closedClients.reduce((sum, c) => sum + c.totalTimeSpent, 0);
      stats.averageTimeToClose = totalTime / closedClients.length;
    }

    return stats;
  };

  const canEditClient = (): boolean => {
    return hasPermission('canManageUsers') || currentUser?.authLevel === 'gestor' || currentUser?.authLevel === 'admin';
  };

  const canDeleteClient = (): boolean => {
    return hasPermission('canManageUsers') || currentUser?.authLevel === 'admin';
  };

  return (
    <ClientContext.Provider value={{
      clients,
      proposals,
      commercialActivities,
      addClient,
      updateClient,
      deleteClient,
      addProposal,
      updateProposal,
      deleteProposal,
      addCommercialActivity,
      updateCommercialActivity,
      deleteCommercialActivity,
      getClientProposals,
      getClientActivities,
      getFunnelStats,
      canEditClient,
      canDeleteClient
    }}>
      {children}
    </ClientContext.Provider>
  );
}

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};