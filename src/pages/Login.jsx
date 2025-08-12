import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: clave
    });

    if (error) {
      setError(error.message);
    } else {
      const user = data.user;
      const role = user?.user_metadata?.role || null;
      setUser({ ...user, role });
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center items-center bg-white p-12 max-w-md mx-auto rounded-l-lg shadow-lg">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">Iniciar Sesión</h1>
          {error && <div className="bg-red-100 text-red-600 p-2 mb-4 rounded text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              placeholder="Correo"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              value={clave}
              placeholder="Clave"
              onChange={(e) => setClave(e.target.value)}
              className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-full transition"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
      <div className="hidden md:flex flex-1 bg-cover bg-center rounded-r-lg" style={{ backgroundImage: "url('/FondoLogin.jpg')" }} />
    </div>
  );
}
