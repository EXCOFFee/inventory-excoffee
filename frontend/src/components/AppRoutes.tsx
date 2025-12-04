/**
 * Configuración de rutas de la aplicación
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layout';
import { 
  LoginPage, 
  DashboardPage, 
  ProductsPage, 
  ProductFormPage, 
  MovementsPage,
  CategoriesPage,
  SuppliersPage,
  ReportsPage,
  AlertsPage,
  UsersPage,
  SettingsPage,
} from './pages';
import { useAuthStore } from '../stores';

// Componente de ruta protegida
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Componente de ruta pública (redirige si ya está autenticado)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Componente de ruta solo para administradores
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Rutas protegidas con layout principal */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:id" element={<ProductFormPage />} />
        <Route path="/products/:id/edit" element={<ProductFormPage />} />
        <Route path="/movements" element={<MovementsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route 
          path="/users" 
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          } 
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Ruta 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Página de Perfil - Dark Theme
const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Mi Perfil</h1>
      <div className="glass-card p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center shadow-glow">
            <span className="text-3xl text-white font-bold">
              {user?.firstName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.firstName} {user?.lastName}</h2>
            <p className="text-gray-400">{user?.email}</p>
            <span className={`
              inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full
              ${user?.role === 'ADMIN' 
                ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30' 
                : 'bg-primary-500/20 text-primary-400 border border-primary-500/30'}
            `}>
              {user?.role === 'ADMIN' ? 'Administrador' : 'Staff'}
            </span>
          </div>
        </div>
        <div className="border-t border-dark-700/50 pt-4">
          <a href="/settings" className="text-primary-400 hover:text-primary-300 text-sm">
            Ir a Configuración →
          </a>
        </div>
      </div>
    </div>
  );
};
