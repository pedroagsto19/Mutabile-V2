export interface SupplierEvaluation {
  id: string;
  supplierId: string;
  projectId?: string;
  projectName?: string;
  evaluationDate: Date;
  ratings: {
    quality: number;
    price: number;
    recommendation: number;
  };
  notes?: string;
  evaluatedBy: string;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  website?: string;
  mainContact?: string;
  description?: string;
  observations?: string;
  ratings: {
    quality: number; // 1-5
    price: number; // 1-5
    recommendation: number; // 1-5
  };
  evaluations: SupplierEvaluation[];
  linkedProjects: string[]; // Project IDs
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SupplierFilters {
  country?: string;
  state?: string;
  city?: string;
  search?: string;
}