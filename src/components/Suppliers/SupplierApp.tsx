import React, { useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '../UI/Button';
import { SupplierList } from './SupplierList';
import { SupplierDetail } from './SupplierDetail';
import { SupplierProvider } from '../../context/SupplierContext';
import { SettingsModal } from '../Settings/SettingsModal';
import { useNavigate } from 'react-router-dom';

export function SupplierApp({ onBackToMenu }: { onBackToMenu?: () => void } = {}) {
  const navigate = useNavigate();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleSupplierSelect = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
  };

  const handleBackToList = () => {
    setSelectedSupplierId(null);
  };

  const handleBack = () => {
    if (onBackToMenu) {
      onBackToMenu();
    } else {
      navigate('/');
    }
  };

  return (
    <SupplierProvider>
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Heebo, sans-serif' }}>
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Menu Principal
                </Button>
                <div className="h-6 w-px bg-gray-300"></div>
                <img src="/png.png" alt="Mutabile Logo" className="h-8 w-auto" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Gestão de Fornecedores
                  </h1>
                  <p className="text-sm text-gray-600">Cadastro, avaliação e ranking de fornecedores</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {selectedSupplierId ? (
            <SupplierDetail
              supplierId={selectedSupplierId}
              onBack={handleBackToList}
            />
          ) : (
            <SupplierList onSupplierSelect={handleSupplierSelect} />
          )}
        </main>
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </SupplierProvider>
  );
}