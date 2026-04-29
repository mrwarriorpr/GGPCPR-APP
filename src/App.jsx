// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { initializeStorage } from './data/store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Empleados from './pages/Empleados';
import Puestos from './pages/Puestos';
import Horarios from './pages/Horarios';
import Vacantes from './pages/Vacantes';
import Citas from './pages/Citas';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a1628', color: 'white', fontSize: 18,
    }}>
      Cargando...
    </div>
  );
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/empleados" element={<PrivateRoute><Empleados /></PrivateRoute>} />
      <Route path="/puestos" element={<PrivateRoute><Puestos /></PrivateRoute>} />
      <Route path="/horarios" element={<PrivateRoute><Horarios /></PrivateRoute>} />
      <Route path="/vacantes" element={<PrivateRoute><Vacantes /></PrivateRoute>} />
      <Route path="/citas" element={<PrivateRoute><Citas /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  useEffect(() => {
    initializeStorage();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
