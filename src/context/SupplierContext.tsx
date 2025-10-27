import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Supplier, SupplierFilters, SupplierEvaluation } from '../types/supplier';
import { useAuth } from './AuthContext';
import { supplierOperations } from '../lib/database';

interface SupplierContextType {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addEvaluation: (supplierId: string, evaluation: Omit<SupplierEvaluation, 'id' | 'supplierId' | 'createdAt'>) => void;
  getSuppliersByRanking: () => Supplier[];
  canDeleteSupplier: () => boolean;
  canEditSupplier: () => boolean;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export function SupplierProvider({ children }: { children: React.ReactNode }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { user: currentUser, hasPermission } = useAuth();

  // Load suppliers from localStorage on mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = () => {
    supplierOperations.getAll()
      .then(setSuppliers)
      .catch(console.error);
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!currentUser) return;
    
    supplierOperations.create(supplierData)
      .then(newSupplier => {
        setSuppliers(prev => [...prev, newSupplier]);
      })
      .catch(error => {
        console.error('Error creating supplier:', error);
        throw error;
      });
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    if (!canEditSupplier()) {
      throw new Error('Sem permissão para editar fornecedores');
    }
    
    supplierOperations.update(id, updates)
      .then(() => {
        loadSuppliers();
      })
      .catch(error => {
        console.error('Error updating supplier:', error);
        throw error;
      });
  };

  const deleteSupplier = (id: string) => {
    if (!canDeleteSupplier()) {
      throw new Error('Sem permissão para excluir fornecedores');
    }
    
    supplierOperations.delete(id)
      .then(() => {
        setSuppliers(prev => prev.filter(s => s.id !== id));
      })
      .catch(error => {
        console.error('Error deleting supplier:', error);
        throw error;
      });
  };

  const addEvaluation = (supplierId: string, evaluationData: Omit<SupplierEvaluation, 'id' | 'supplierId' | 'createdAt'>) => {
    if (!currentUser) return;
    
    supplierOperations.addEvaluation(supplierId, evaluationData)
      .then(() => {
        loadSuppliers();
      })
      .catch(error => {
        console.error('Error adding evaluation:', error);
        throw error;
      });
  };

  const getSuppliersByRanking = (): Supplier[] => {
    return [...suppliers].sort((a, b) => {
      const avgA = (a.ratings.quality + a.ratings.price + a.ratings.recommendation) / 3;
      const avgB = (b.ratings.quality + b.ratings.price + b.ratings.recommendation) / 3;
      return avgB - avgA; // Descending order (best first)
    });
  };

  const canDeleteSupplier = (): boolean => {
    return hasPermission('canManageUsers') || currentUser?.authLevel === 'gestor' || currentUser?.authLevel === 'admin';
  };

  const canEditSupplier = (): boolean => {
    return hasPermission('canManageUsers') || currentUser?.authLevel === 'gestor' || currentUser?.authLevel === 'admin';
  };

  return (
    <SupplierContext.Provider value={{
      suppliers,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addEvaluation,
      getSuppliersByRanking,
      canDeleteSupplier,
      canEditSupplier
    }}>
      {children}
    </SupplierContext.Provider>
  );
}

export const useSupplier = () => {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};