import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ConfirmEmailPage from '@/pages/ConfirmEmailPage';
import DeleteAccountConfirmPage from '@/pages/DeleteAccountConfirmPage';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ReactNode } from 'react';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import ReservasPage from '@/pages/ReservasPage';
import ClientesPage from '@/pages/ClientesPage';
import EventosPage from '@/pages/EventosPage';
import MantenimientoPage from '@/pages/MantenimientoPage';
import ReportesPage from '@/pages/ReportesPage';
import UserHomePage from '@/pages/UserHomePage';

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/inicio" replace />;
  return <>{children}</>;
}

// =============================================
// App Root
// =============================================
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/confirmar-correo" element={<ConfirmEmailPage />} />
      <Route path="/eliminar-cuenta" element={<DeleteAccountConfirmPage />} />

      {/* Protected - All authenticated users */}
      <Route path="/inicio" element={
        <ProtectedRoute><UserHomePage /></ProtectedRoute>
      } />
      <Route path="/reservas" element={
        <ProtectedRoute><ReservasPage /></ProtectedRoute>
      } />
      <Route path="/eventos" element={
        <ProtectedRoute><EventosPage /></ProtectedRoute>
      } />

      {/* Protected - All authenticated users */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="admin"><DashboardPage /></ProtectedRoute>
      } />
      <Route path="/clientes" element={
        <ProtectedRoute requiredRole="admin"><ClientesPage /></ProtectedRoute>
      } />
      <Route path="/mantenimiento" element={
        <ProtectedRoute requiredRole="admin"><MantenimientoPage /></ProtectedRoute>
      } />
      <Route path="/reportes" element={
        <ProtectedRoute requiredRole="admin"><ReportesPage /></ProtectedRoute>
      } />

      {/* Landing */}
      <Route path="/" element={
        <PublicRoute><LandingPage /></PublicRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}