import type { Client, Proposal, CommercialActivity } from '../types/client';

export interface LocalClient {
  id: string;
  name: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  email: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  funnelStage: 'prospecting' | 'proposal_sent' | 'negotiation' | 'closed' | 'lost';
  totalTimeSpent: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface LocalProposal {
  id: string;
  clientId: string;
  description: string;
  value: number;
  status: 'active' | 'paused' | 'rejected' | 'accepted';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  notes?: string;
}

export interface LocalCommercialActivity {
  id: string;
  clientId: string;
  type: 'meeting' | 'call' | 'email' | 'visit' | 'other';
  description: string;
  timeSpent: number;
  date: string;
  createdAt: string;
  createdBy: string;
  notes?: string;
}

class ClientStorage {
  private static CLIENTS_KEY = 'mutabile_clients';
  private static PROPOSALS_KEY = 'mutabile_proposals';
  private static ACTIVITIES_KEY = 'mutabile_commercial_activities';

  static clearAllData() {
    console.log('Limpando todos os dados locais...');
    try {
      localStorage.removeItem(this.CLIENTS_KEY);
      localStorage.removeItem(this.PROPOSALS_KEY);
      localStorage.removeItem(this.ACTIVITIES_KEY);
      console.log('Dados locais limpos com sucesso!');
    } catch (error) {
      console.error('Erro ao limpar dados locais:', error);
    }
  }

  // Client methods
  static getClients(): LocalClient[] {
    try {
      const clients = localStorage.getItem(this.CLIENTS_KEY);
      return clients ? JSON.parse(clients) : [];
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  }

  static saveClients(clients: LocalClient[]) {
    try {
      localStorage.setItem(this.CLIENTS_KEY, JSON.stringify(clients));
    } catch (error) {
      console.error('Error saving clients:', error);
    }
  }

  static createClient(clientData: Omit<LocalClient, 'id' | 'createdAt' | 'updatedAt'>): LocalClient {
    try {
      const clients = this.getClients();
      
      // Check for duplicates
      const existingClient = clients.find(c => 
        c.document === clientData.document || c.email === clientData.email
      );
      
      if (existingClient) {
        throw new Error('Cliente já existe com este CPF/CNPJ ou e-mail');
      }
      
      const newClient: LocalClient = {
        ...clientData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      clients.push(newClient);
      this.saveClients(clients);
      return newClient;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  static updateClient(id: string, updates: Partial<LocalClient>): boolean {
    try {
      const clients = this.getClients();
      const clientIndex = clients.findIndex(c => c.id === id);
      
      if (clientIndex === -1) return false;
      
      // Check for duplicates if document or email is being updated
      if (updates.document || updates.email) {
        const existingClient = clients.find(c => 
          c.id !== id && (
            (updates.document && c.document === updates.document) ||
            (updates.email && c.email === updates.email)
          )
        );
        
        if (existingClient) {
          throw new Error('Já existe outro cliente com este CPF/CNPJ ou e-mail');
        }
      }
      
      const updatedClient = { 
        ...clients[clientIndex], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      clients[clientIndex] = updatedClient;
      this.saveClients(clients);
      return true;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  static deleteClient(id: string): boolean {
    try {
      const clients = this.getClients();
      const filteredClients = clients.filter(c => c.id !== id);
      
      if (filteredClients.length === clients.length) return false;
      
      this.saveClients(filteredClients);
      
      // Also delete related proposals and activities
      this.deleteProposalsByClient(id);
      this.deleteActivitiesByClient(id);
      
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  }

  // Proposal methods
  static getProposals(): LocalProposal[] {
    try {
      const proposals = localStorage.getItem(this.PROPOSALS_KEY);
      return proposals ? JSON.parse(proposals) : [];
    } catch (error) {
      console.error('Error getting proposals:', error);
      return [];
    }
  }

  static saveProposals(proposals: LocalProposal[]) {
    try {
      localStorage.setItem(this.PROPOSALS_KEY, JSON.stringify(proposals));
    } catch (error) {
      console.error('Error saving proposals:', error);
    }
  }

  static createProposal(proposalData: Omit<LocalProposal, 'id' | 'createdAt' | 'updatedAt'>): LocalProposal {
    try {
      const proposals = this.getProposals();
      const newProposal: LocalProposal = {
        ...proposalData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      proposals.push(newProposal);
      this.saveProposals(proposals);
      return newProposal;
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  }

  static updateProposal(id: string, updates: Partial<LocalProposal>): boolean {
    try {
      const proposals = this.getProposals();
      const proposalIndex = proposals.findIndex(p => p.id === id);
      
      if (proposalIndex === -1) return false;
      
      const updatedProposal = { 
        ...proposals[proposalIndex], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      proposals[proposalIndex] = updatedProposal;
      this.saveProposals(proposals);
      return true;
    } catch (error) {
      console.error('Error updating proposal:', error);
      return false;
    }
  }

  static deleteProposal(id: string): boolean {
    try {
      const proposals = this.getProposals();
      const filteredProposals = proposals.filter(p => p.id !== id);
      
      if (filteredProposals.length === proposals.length) return false;
      
      this.saveProposals(filteredProposals);
      return true;
    } catch (error) {
      console.error('Error deleting proposal:', error);
      return false;
    }
  }

  static deleteProposalsByClient(clientId: string): void {
    try {
      const proposals = this.getProposals();
      const filteredProposals = proposals.filter(p => p.clientId !== clientId);
      this.saveProposals(filteredProposals);
    } catch (error) {
      console.error('Error deleting proposals by client:', error);
    }
  }

  // Commercial Activity methods
  static getCommercialActivities(): LocalCommercialActivity[] {
    try {
      const activities = localStorage.getItem(this.ACTIVITIES_KEY);
      return activities ? JSON.parse(activities) : [];
    } catch (error) {
      console.error('Error getting commercial activities:', error);
      return [];
    }
  }

  static saveCommercialActivities(activities: LocalCommercialActivity[]) {
    try {
      localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(activities));
    } catch (error) {
      console.error('Error saving commercial activities:', error);
    }
  }

  static createCommercialActivity(activityData: Omit<LocalCommercialActivity, 'id' | 'createdAt'>): LocalCommercialActivity {
    try {
      const activities = this.getCommercialActivities();
      const newActivity: LocalCommercialActivity = {
        ...activityData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      activities.push(newActivity);
      this.saveCommercialActivities(activities);
      
      // Update client's total time spent
      this.updateClientTimeSpent(activityData.clientId);
      
      return newActivity;
    } catch (error) {
      console.error('Error creating commercial activity:', error);
      throw error;
    }
  }

  static updateCommercialActivity(id: string, updates: Partial<LocalCommercialActivity>): boolean {
    try {
      const activities = this.getCommercialActivities();
      const activityIndex = activities.findIndex(a => a.id === id);
      
      if (activityIndex === -1) return false;
      
      const oldActivity = activities[activityIndex];
      const updatedActivity = { ...oldActivity, ...updates };
      
      activities[activityIndex] = updatedActivity;
      this.saveCommercialActivities(activities);
      
      // Update client's total time spent if time changed
      if (updates.timeSpent !== undefined || updates.clientId !== undefined) {
        this.updateClientTimeSpent(updatedActivity.clientId);
        if (oldActivity.clientId !== updatedActivity.clientId) {
          this.updateClientTimeSpent(oldActivity.clientId);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating commercial activity:', error);
      return false;
    }
  }

  static deleteCommercialActivity(id: string): boolean {
    try {
      const activities = this.getCommercialActivities();
      const activity = activities.find(a => a.id === id);
      const filteredActivities = activities.filter(a => a.id !== id);
      
      if (filteredActivities.length === activities.length) return false;
      
      this.saveCommercialActivities(filteredActivities);
      
      // Update client's total time spent
      if (activity) {
        this.updateClientTimeSpent(activity.clientId);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting commercial activity:', error);
      return false;
    }
  }

  static deleteActivitiesByClient(clientId: string): void {
    try {
      const activities = this.getCommercialActivities();
      const filteredActivities = activities.filter(a => a.clientId !== clientId);
      this.saveCommercialActivities(filteredActivities);
    } catch (error) {
      console.error('Error deleting activities by client:', error);
    }
  }

  static updateClientTimeSpent(clientId: string): void {
    try {
      const activities = this.getCommercialActivities();
      const clientActivities = activities.filter(a => a.clientId === clientId);
      const totalTime = clientActivities.reduce((sum, activity) => sum + activity.timeSpent, 0);
      
      this.updateClient(clientId, { totalTimeSpent: totalTime });
    } catch (error) {
      console.error('Error updating client time spent:', error);
    }
  }

  // Helper methods
  static getProposalsByClient(clientId: string): LocalProposal[] {
    return this.getProposals().filter(p => p.clientId === clientId);
  }

  static getActivitiesByClient(clientId: string): LocalCommercialActivity[] {
    return this.getCommercialActivities().filter(a => a.clientId === clientId);
  }
}

export default ClientStorage;