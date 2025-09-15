import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Client, Proposal, CommercialActivity, ClientFilters, FunnelStats } from '../types/client';
import { useAuth } from './AuthContext';
import ClientStorage from '../lib/clientStorage';

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

// Helper function to convert local client to app client
const convertLocalClient = (localClient: any): Client => ({
  ...localClient,
  createdAt: new Date(localClient.createdAt),
  updatedAt: new Date(localClient.updatedAt)
});

const convertLocalProposal = (localProposal: any): Proposal => ({
  ...localProposal,
  createdAt: new Date(localProposal.createdAt),
  updatedAt: new Date(localProposal.updatedAt)
});

const convertLocalActivity = (localActivity: any): CommercialActivity => ({
  ...localActivity,
  date: new Date(localActivity.date),
  createdAt: new Date(localActivity.createdAt)
});

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [commercialActivities, setCommercialActivities] = useState<CommercialActivity[]>([]);
  const { user: currentUser, hasPermission } = useAuth();

  // Load data from localStorage on mount
  useEffect(() => {
    // Initialize sample data if none exist
    const existingClients = ClientStorage.getClients();
    if (existingClients.length === 0) {
      ClientStorage.initializeSampleClients();
    }
    
    loadData();
  }, []);

  const loadData = () => {
    const localClients = ClientStorage.getClients();
    const localProposals = ClientStorage.getProposals();
    const localActivities = ClientStorage.getCommercialActivities();
    
    setClients(localClients.map(convertLocalClient));
    setProposals(localProposals.map(convertLocalProposal));
    setCommercialActivities(localActivities.map(convertLocalActivity));
  };

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'totalTimeSpent'>) => {
    if (!currentUser) return;
    
    const localClientData = {
      ...clientData,
      totalTimeSpent: 0,
      createdBy: currentUser.id
    };
    
    const newLocalClient = ClientStorage.createClient(localClientData);
    const newClient = convertLocalClient(newLocalClient);
    
    setClients(prev => [...prev, newClient]);
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    if (!canEditClient()) {
      throw new Error('Sem permissão para editar clientes');
    }
    
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    ClientStorage.updateClient(id, updateData);
    loadData();
  };

  const deleteClient = (id: string) => {
    if (!canDeleteClient()) {
      throw new Error('Sem permissão para excluir clientes');
    }
    
    ClientStorage.deleteClient(id);
    setClients(prev => prev.filter(c => c.id !== id));
    setProposals(prev => prev.filter(p => p.clientId !== id));
    setCommercialActivities(prev => prev.filter(a => a.clientId !== id));
  };

  const addProposal = (proposalData: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!currentUser) return;
    
    const localProposalData = {
      ...proposalData,
      createdBy: currentUser.id
    };
    
    const newLocalProposal = ClientStorage.createProposal(localProposalData);
    const newProposal = convertLocalProposal(newLocalProposal);
    
    setProposals(prev => [...prev, newProposal]);
  };

  const updateProposal = (id: string, updates: Partial<Proposal>) => {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    ClientStorage.updateProposal(id, updateData);
    loadData();
  };

  const deleteProposal = (id: string) => {
    ClientStorage.deleteProposal(id);
    setProposals(prev => prev.filter(p => p.id !== id));
  };

  const addCommercialActivity = (activityData: Omit<CommercialActivity, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!currentUser) return;
    
    const localActivityData = {
      ...activityData,
      date: activityData.date.toISOString(),
      createdBy: currentUser.id
    };
    
    const newLocalActivity = ClientStorage.createCommercialActivity(localActivityData);
    const newActivity = convertLocalActivity(newLocalActivity);
    
    setCommercialActivities(prev => [...prev, newActivity]);
    
    // Update client's total time spent
    const updatedClients = ClientStorage.getClients();
    setClients(updatedClients.map(convertLocalClient));
  };

  const updateCommercialActivity = (id: string, updates: Partial<CommercialActivity>) => {
    const updateData = {
      ...updates,
      date: updates.date?.toISOString()
    };
    
    ClientStorage.updateCommercialActivity(id, updateData);
    loadData();
  };

  const deleteCommercialActivity = (id: string) => {
    ClientStorage.deleteCommercialActivity(id);
    loadData();
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