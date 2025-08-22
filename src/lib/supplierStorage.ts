import type { Supplier } from '../types/supplier';

export interface LocalSupplier {
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
    quality: number;
    price: number;
    recommendation: number;
  };
  linkedProjects: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

class SupplierStorage {
  private static SUPPLIERS_KEY = 'mutabile_suppliers';

  static getSuppliers(): LocalSupplier[] {
    try {
      const suppliers = localStorage.getItem(this.SUPPLIERS_KEY);
      return suppliers ? JSON.parse(suppliers) : [];
    } catch (error) {
      console.error('Error getting suppliers:', error);
      return [];
    }
  }

  static saveSuppliers(suppliers: LocalSupplier[]) {
    try {
      localStorage.setItem(this.SUPPLIERS_KEY, JSON.stringify(suppliers));
    } catch (error) {
      console.error('Error saving suppliers:', error);
    }
  }

  static createSupplier(supplierData: Omit<LocalSupplier, 'id' | 'createdAt' | 'updatedAt'>): LocalSupplier {
    try {
      const suppliers = this.getSuppliers();
      const newSupplier: LocalSupplier = {
        ...supplierData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      suppliers.push(newSupplier);
      this.saveSuppliers(suppliers);
      return newSupplier;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  static updateSupplier(id: string, updates: Partial<LocalSupplier>): boolean {
    try {
      const suppliers = this.getSuppliers();
      const supplierIndex = suppliers.findIndex(s => s.id === id);
      
      if (supplierIndex === -1) return false;
      
      const updatedSupplier = { 
        ...suppliers[supplierIndex], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      suppliers[supplierIndex] = updatedSupplier;
      this.saveSuppliers(suppliers);
      return true;
    } catch (error) {
      console.error('Error updating supplier:', error);
      return false;
    }
  }

  static deleteSupplier(id: string): boolean {
    try {
      const suppliers = this.getSuppliers();
      const filteredSuppliers = suppliers.filter(s => s.id !== id);
      
      if (filteredSuppliers.length === suppliers.length) return false;
      
      this.saveSuppliers(filteredSuppliers);
      return true;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return false;
    }
  }
}

export default SupplierStorage;