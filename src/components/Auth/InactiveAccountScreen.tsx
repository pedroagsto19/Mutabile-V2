import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InactiveAccountScreenProps {
  message: string;
}

export function InactiveAccountScreen({ message }: InactiveAccountScreenProps) {
  const handleBackToLogin = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/png.png" alt="Mutabile Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mutabile</h1>
              <p className="text-sm text-gray-600">Gestão de Projetos</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-8 shadow-lg">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-100 rounded-full p-3">
              <AlertTriangle className="h-12 w-12 text-orange-600" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-orange-900 text-center mb-3">
            Conta Desativada
          </h2>

          <p className="text-orange-700 text-center mb-6">
            {message}
          </p>

          <div className="space-y-3">
            <button
              onClick={handleBackToLogin}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Voltar ao Login
            </button>

            <div className="bg-orange-100 rounded-lg p-4">
              <p className="text-sm text-orange-800 text-center">
                Se você acredita que isso é um erro, entre em contato com o administrador do sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
