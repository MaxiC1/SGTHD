// components/Navbar.jsx
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  return (
    <nav className="bg-blue-500 text-white px-4 py-3 flex justify-between items-center">
      <div className="flex gap-4">
        <Link to="/dashboard" className="hover:underline">Inicio</Link>
        <Link to="/registros" className="hover:underline">Registros</Link>
        <Link to="/registro-toner" className="hover:underline">Nuevo Registro</Link>
        {user?.role === 'admin' && (
          <>
            <Link to="/clientes" className="hover:underline">Clientes</Link>
            <Link to="/maquinas" className="hover:underline">Máquinas</Link>
            <Link to="/toners" className="hover:underline">Toners</Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="font-semibold">{user?.email}</span>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
