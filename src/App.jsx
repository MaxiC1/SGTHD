import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { useAuthStore } from './store/authStore';

export default function App() {
  const initializeUser = useAuthStore((state) => state.initializeUser);

  useEffect(() => {
    initializeUser();
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

/*export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

//Esquema de rutas anterior al cambio de rutas protegidas por rol

/*function ProtectedRoute({ children, roles }) {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/no-access" />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['admin', 'secretaria']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin-only" element={
          <ProtectedRoute roles={['admin']}>
            <div>Solo admin puede ver esto</div>
          </ProtectedRoute>
        } />
        <Route path="/no-access" element={<div>No tienes acceso</div>} />
        <Route path="/registro-toner" element={
          <ProtectedRoute roles={['admin', 'secretaria']}>
            <RegistroToner />
          </ProtectedRoute>
        } />
        <Route path="/clientes" element={
          <ProtectedRoute roles={['admin']}>
            <Clientes />
          </ProtectedRoute>
        } />
        <Route path="/toners" element={
          <ProtectedRoute roles={['admin']}>
            <Toners />
          </ProtectedRoute>
        } />
        <Route path="/maquinas" element={
          <ProtectedRoute roles={['admin']}>
            <Maquinas />
          </ProtectedRoute>
        } />
        <Route path="/registros" element={
          <ProtectedRoute roles={['admin', 'secretaria']}>
            <Registros />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;

*/