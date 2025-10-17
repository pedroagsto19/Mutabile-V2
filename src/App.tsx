import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { MainMenu } from "./components/MainMenu/MainMenu";
import { WorksApp } from "./components/Works/WorksApp";
import { SupplierApp } from "./components/Suppliers/SupplierApp";
import { ClientApp } from "./components/Clients/ClientApp";
import { NotificationProvider } from "./context/NotificationContext";
import { ProjectProvider } from "./context/ProjectContext";
import { ClientProvider } from "./context/ClientContext";

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={(
          <ProtectedRoute>
            <MainMenu />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/obras/*"
        element={(
          <ProtectedRoute>
            <WorksApp />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/fornecedores"
        element={(
          <ProtectedRoute>
            <SupplierApp />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/clientes"
        element={(
          <ProtectedRoute>
            <ClientApp />
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ProjectProvider>
          <ClientProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ClientProvider>
        </ProjectProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
