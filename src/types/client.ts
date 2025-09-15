export interface Client {
  id: string;
  name: string;
  document: string; // CPF ou CNPJ
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
  totalTimeSpent: number; // em horas
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Proposal {
  id: string;
  clientId: string;
  description: string;
  value: number;
  status: 'active' | 'paused' | 'rejected' | 'accepted';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  notes?: string;
}

export interface CommercialActivity {
  id: string;
  clientId: string;
  type: 'meeting' | 'call' | 'email' | 'visit' | 'other';
  description: string;
  timeSpent: number; // em horas
  date: Date;
  createdAt: Date;
  createdBy: string;
  notes?: string;
}

export interface ClientFilters {
  search?: string;
  funnelStage?: string;
  documentType?: string;
  state?: string;
  city?: string;
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface FunnelStats {
  prospecting: number;
  proposalSent: number;
  negotiation: number;
  closed: number;
  lost: number;
  totalValue: number;
  averageTimeToClose: number;
}