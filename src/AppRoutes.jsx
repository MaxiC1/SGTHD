import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Maquinas from './pages/Maquinas';
import Toners from './pages/Toners';
import RegistroToner from './pages/RegistroToner';
import Registros from './pages/Registros';
import { useEffect } from 'react';

function RequireAuth({ children, roles }) {
  const user = useAuthStore(state => state.user);

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function AppRoutes() {
  const user = useAuthStore(state => state.user);
  const location = useLocation();
  const hideNavbar = location.pathname === '/login';

  return (
    <>
            <ScrollToTop />
            {!hideNavbar && <Navbar />}
            <Routes>
                <Route
                path="/"
                element={
                    user
                    ? <Navigate to="/dashboard" replace />
                    : <Navigate to="/login" replace />
                }
                />
                <Route
                path="/login"
                element={
                    user
                    ? <Navigate to="/dashboard" replace />
                    : <Login />
                }
                />
                <Route
                path="/dashboard"
                element={
                    <RequireAuth roles={['admin', 'secretaria']}>
                    <Dashboard />
                    </RequireAuth>
                }
                />
                <Route
                path="/clientes"
                element={
                    <RequireAuth roles={['admin']}>
                    <Clientes />
                    </RequireAuth>
                }
                />
                <Route
                path="/maquinas"
                element={
                    <RequireAuth roles={['admin']}>
                    <Maquinas />
                    </RequireAuth>
                }
                />
                <Route
                path="/toners"
                element={
                    <RequireAuth roles={['admin']}>
                    <Toners />
                    </RequireAuth>
                }
                />
                <Route
                path="/registro-toner"
                element={
                    <RequireAuth roles={['admin', 'secretaria']}>
                    <RegistroToner />
                    </RequireAuth>
                }
                />
                <Route
                path="/registros"
                element={
                    <RequireAuth roles={['admin', 'secretaria']}>
                    <Registros />
                    </RequireAuth>
                }
                />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
    </>
  );
}