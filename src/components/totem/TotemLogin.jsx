import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function TotemLogin() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Endpoint-ul de Totem Login
      const res = await api.post('/totem/login', { code });
      
      // Salvăm datele necesare pentru sesiune
      localStorage.setItem('totem_pacient_id', res.data.pacient_id);
      localStorage.setItem('totem_pacient_nume', res.data.nume);
      
      // Mergem la interfața LIVE
      navigate('/totem/live');
    } catch (err) {
      alert("Cod incorect!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center w-full max-w-sm px-4">
        <h1 className="text-white text-3xl font-bold mb-8">Conectare Totem</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            type="text" 
            maxLength="4"
            placeholder="0000"
            className="w-full bg-gray-900 text-white text-center text-5xl tracking-[1rem] p-4 rounded-xl border border-gray-700 focus:border-indigo-500 outline-none font-mono"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <button 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl text-xl font-bold hover:bg-indigo-500 transition"
          >
            {loading ? "Se conectează..." : "START"}
          </button>
        </form>
      </div>
    </div>
  );
}