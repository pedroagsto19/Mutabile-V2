import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Supplier, SupplierFilters, SupplierEvaluation } from '../types/supplier';
import { useAuth } from './AuthContext';
import SupplierStorage from '../lib/supplierStorage';

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

// Helper function to convert local supplier to app supplier
const convertLocalSupplier = (localSupplier: any): Supplier => ({
  ...localSupplier,
  evaluations: (localSupplier.evaluations || []).map((evaluation: any) => ({
    ...evaluation,
    evaluationDate: new Date(evaluation.evaluationDate),
    createdAt: new Date(evaluation.createdAt)
  })),
  createdAt: new Date(localSupplier.createdAt),
  updatedAt: new Date(localSupplier.updatedAt)
});

export function SupplierProvider({ children }: { children: React.ReactNode }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { user: currentUser, hasPermission } = useAuth();

  // Load suppliers from localStorage on mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = () => {
    const localSuppliers = SupplierStorage.getSuppliers();
    setSuppliers(localSuppliers.map(convertLocalSupplier));
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!currentUser) return;
    
    const localSupplierData = {
      ...supplierData,
      evaluations: [],
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const newLocalSupplier = SupplierStorage.createSupplier(localSupplierData);
    const newSupplier = convertLocalSupplier(newLocalSupplier);
    
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    if (!canEditSupplier()) {
      throw new Error('Sem permissão para editar fornecedores');
    }
    
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    SupplierStorage.updateSupplier(id, updateData);
    loadSuppliers();
  };

  const deleteSupplier = (id: string) => {
    if (!canDeleteSupplier()) {
      throw new Error('Sem permissão para excluir fornecedores');
    }
    
    SupplierStorage.deleteSupplier(id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const addEvaluation = (supplierId: string, evaluationData: Omit<SupplierEvaluation, 'id' | 'supplierId' | 'createdAt'>) => {
    if (!currentUser) return;
    
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    
    const newEvaluation: SupplierEvaluation = {
      id: Date.now().toString(),
      supplierId,
      ...evaluationData,
      evaluatedBy: currentUser.id,
      createdAt: new Date()
    };
    
    const updatedEvaluations = [...supplier.evaluations, newEvaluation];
    
    // Calculate new average ratings
    const avgRatings = {
      quality: Math.round(updatedEvaluations.reduce((sum, eval) => sum + eval.ratings.quality, 0) / updatedEvaluations.length),
      price: Math.round(updatedEvaluations.reduce((sum, eval) => sum + eval.ratings.price, 0) / updatedEvaluations.length),
      recommendation: Math.round(updatedEvaluations.reduce((sum, eval) => sum + eval.ratings.recommendation, 0) / updatedEvaluations.length)
    };
    
    const updateData = {
      evaluations: updatedEvaluations.map(eval => ({
        ...eval,
        evaluationDate: eval.evaluationDate.toISOString(),
        createdAt: eval.createdAt.toISOString()
      })),
      ratings: avgRatings,
      updatedAt: new Date().toISOString()
    };
    
    SupplierStorage.updateSupplier(supplierId, updateData);
    loadSuppliers();
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