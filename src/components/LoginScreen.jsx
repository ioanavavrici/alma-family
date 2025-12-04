import React, { useState } from 'react';
import { Lock, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function LoginScreen({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await api.post('/auth/register', { email, password });
        await performLogin();
      } else {
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
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData);
    localStorage.setItem('access_token', response.data.access_token);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-alma-dark flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header colorat */}
        <div className="bg-alma-purple p-8 text-center">
            <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">
            {isRegistering ? "Cont Nou" : "Bine ai revenit"}
            </h1>
            <p className="text-white/70 text-sm mt-1">Zona de administrare Familie</p>
        </div>
        
        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-alma-gray uppercase mb-1">Email</label>
                <input 
                required type="email" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-alma-rose focus:ring-2 focus:ring-alma-rose/20 transition"
                value={email} onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-alma-gray uppercase mb-1">Parolă</label>
                <input 
                required type="password" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-alma-rose focus:ring-2 focus:ring-alma-rose/20 transition"
                value={password} onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            
            {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>}

            <button disabled={loading} type="submit" className="w-full bg-alma-dark text-white py-4 rounded-xl font-bold hover:bg-alma-purple transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                {loading ? "Se procesează..." : (isRegistering ? "Înregistrare" : "Intră în Cont")} 
                {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
            </form>

            <div className="mt-6 text-center space-y-4">
                <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-alma-rose hover:text-alma-purple font-medium">
                    {isRegistering ? "Ai deja cont? Loghează-te" : "Nu ai cont? Înregistrează-te"}
                </button>
                
                <div className="border-t border-gray-100 pt-4">
                    <button onClick={() => navigate('/')} className="text-xs text-alma-gray hover:text-alma-dark">
                        ← Înapoi la meniul principal
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}