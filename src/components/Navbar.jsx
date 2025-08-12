import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FaHome, FaClipboardList, FaPlusCircle, FaUsers, FaCogs, FaTint, FaSignOutAlt } from 'react-icons/fa';

export default function Navbar() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: 'Inicio', icon: <FaHome /> },
    { to: '/registros', label: 'Registros', icon: <FaClipboardList /> },
    { to: '/registro-toner', label: 'Nuevo Registro', icon: <FaPlusCircle /> },
  ];

  if (user?.role === 'admin') {
    links.push(
      { to: '/clientes', label: 'Clientes', icon: <FaUsers /> },
      { to: '/maquinas', label: 'Máquinas', icon: <FaCogs /> },
      { to: '/toners', label: 'Toners', icon: <FaTint /> },
    );
  }

  return (
    <nav className="fixed top-0 left-0 h-full w-53 bg-white shadow-md flex flex-col justify-between">
      <div className="p-6">
        <img src="/Logo.png" alt="Control Toner HD Logo" className="mb-3 max-h-20 w-auto object-contain" />
        <ul className="space-y-4 pt-4">
          {links.map(({ to, label, icon }) => (
            <li key={to}>
              <Link
                to={to}
                className={`flex items-center gap-2 px-2 py-2 rounded hover:bg-blue-100 transition ${
                  location.pathname === to ? 'bg-blue-200 font-semibold text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{icon}</span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-6 border-t border-gray-200">
        <div className="mb-4 text-gray-700 font-semibold truncate">{user?.email}</div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded transition"
        >
          <FaSignOutAlt />
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
