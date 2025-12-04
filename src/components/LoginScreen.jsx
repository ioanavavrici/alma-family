import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import api from '../api';

export default function LoginScreen({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        // 1. REGISTER (Trimitem JSON)
        await api.post('/auth/register', { email, password });
        // Dacă e ok, facem login automat
        await performLogin();
      } else {
        // 2. LOGIN DIRECT
        await performLogin();
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || "Eroare de conexiune.";
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const performLogin = async () => {
    // Backend-ul cere Form Data pentru login (OAuth2 standard)
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData);
    
    // Salvăm token-ul primit
    localStorage.setItem('access_token', response.data.access_token);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border-t-4 border-purple-500">
        <div className="flex justify-center mb-6">
          <div className="bg-purple-100 p-3 rounded-full">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center text-gray-800">
          {isRegistering ? "Creează Cont Familie" : "Autentificare Familie"}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              required type="email" 
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Parolă</label>
            <input 
              required type="password" 
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

          <button disabled={loading} type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2">
            {loading ? "Se procesează..." : (isRegistering ? "Înregistrare" : "Intră în Cont")} 
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-purple-600 hover:underline">
            {isRegistering ? "Ai deja cont? Loghează-te" : "Nu ai cont? Înregistrează-te"}
          </button>
        </div>
      </div>
    </div>
  );
}