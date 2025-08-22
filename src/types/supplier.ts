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
  ratings: {
    quality: number; // 1-5
    price: number; // 1-5
    recommendation: number; // 1-5
  };
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